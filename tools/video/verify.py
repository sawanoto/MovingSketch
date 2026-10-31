"""Decode the complete MP4 and check note count, pitches, timestamps and visual onset.
Requires Python 3 + numpy. Writes verification.json next to the MP4.
"""
import json, subprocess, pathlib, sys
import numpy as np
out = pathlib.Path(sys.argv[1] if len(sys.argv)>1 else 'video-output')
report = json.loads((out/'report.json').read_text())
mp4 = str(out/'001_doremi-pipes.mp4')
def ff(*args):
    return subprocess.check_output(['ffmpeg','-v','error','-i',mp4,*args])
audio = np.frombuffer(ff('-vn','-ac','1','-ar','48000','-f','f32le','-'),dtype='<f4')
# 5 ms RMS envelope; the original synth has an attack and a 290 ms release.
block=240
rms=np.sqrt(np.mean(audio[:len(audio)//block*block].reshape(-1,block)**2,axis=1))
on=rms>.008
starts=np.flatnonzero(on & ~np.r_[False,on[:-1]])*.005
assert len(starts)==len(report['log']), (len(starts),len(report['log']))
expected=np.array([e['actualMs']/1000 for e in report['log']])
errors=starts-expected
assert np.max(np.abs(errors))<.15, errors.tolist()
frequencies=[261.63,293.66,329.63,349.23,392,440,493.88,523.25]
pitch_errors=[]
for event,t in zip(report['log'],starts):
    s=audio[int((t+.035)*48000):int((t+.18)*48000)]
    n=65536
    hz=np.argmax(abs(np.fft.rfft(s*np.hanning(len(s)),n=n)))*48000/n
    pitch_errors.append(abs(hz-frequencies[event['note']]))
assert max(pitch_errors)<3
video=np.frombuffer(ff('-an','-vf','scale=198:100,fps=30','-f','rawvideo','-pix_fmt','rgb24','-'),dtype=np.uint8).reshape(-1,100,198,3)
# The first red pipe visibly bounces when the first note sounds. Compare its top edge.
region=video[:,42:49,14:22].astype(int)
change=np.mean(abs(region-region[15]),axis=(1,2,3))
visual=np.flatnonzero((change>2)&(np.arange(len(change))/30>1.0))[0]/30
assert abs(visual-starts[0])<.1, (visual,starts[0])
meta=report['metadata']; v=next(s for s in meta['streams'] if s['codec_type']=='video'); a=next(s for s in meta['streams'] if s['codec_type']=='audio')
assert (v['codec_name'],v['width'],v['height'],v['r_frame_rate'],v['pix_fmt'])==('h264',1080,1920,'30/1','yuv420p')
assert a['codec_name']=='aac'
assert abs(float(v['duration'])-float(a['duration']))<.1
assert len(video)>=report['scenario']['durationMs']/1000*30-3
result=dict(decodedFrames=len(video),audioNotes=len(starts),maxAudioTimingErrorMs=round(max(abs(errors))*1000,2),maxPitchErrorHz=round(max(pitch_errors),2),firstVisualOnsetSeconds=visual,firstAudioOnsetSeconds=float(starts[0]),initialSyncDifferenceMs=round((visual-starts[0])*1000,2),peakAudio=float(max(abs(audio))),finalSilenceRMS=float(np.sqrt(np.mean(audio[-48000:]**2))),format='1080x1920 H.264 yuv420p / AAC / 30fps')
(out/'verification.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
