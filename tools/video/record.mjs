// One MediaRecorder and one clock for canvas video + the actual p5 master output.
export async function record(page) {
  return page.evaluate(async () => {
    const canvas = document.querySelector('canvas');
    const context = getAudioContext();
    await userStartAudio();
    const audio = context.createMediaStreamDestination();
    const master = p5.soundOut.output;
    master.connect(audio);
    const video = canvas.captureStream(30);
    const stream = new MediaStream([...video.getVideoTracks(), ...audio.stream.getAudioTracks()]);
    const mimeType = 'video/webm;codecs=vp9,opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) throw new Error('VP9/Opus MediaRecorder unavailable');
    const recorder = new MediaRecorder(stream, {mimeType, videoBitsPerSecond:6000000,audioBitsPerSecond:192000});
    const chunks = [];
    recorder.ondataavailable = e => {if (e.data.size) chunks.push(e.data);};
    const stopped = new Promise((resolve,reject) => {
      recorder.onstop = resolve; recorder.onerror = e => reject(new Error(e.error?.message || 'Recorder failed'));
    });
    recorder.start();
    await new Promise(resolve => recorder.addEventListener('start',resolve,{once:true}));
    const log = await window.doremiDemo.start();
    recorder.stop(); await stopped;
    master.disconnect(audio);
    stream.getTracks().forEach(track => track.stop());
    const blob = new Blob(chunks,{type:mimeType});
    const base64 = await new Promise(resolve => {const reader = new FileReader(); reader.onload = () => resolve(reader.result.slice(reader.result.indexOf(';base64,') + 8)); reader.readAsDataURL(blob);});
    return {base64, log, scenario:window.doremiDemo.scenario, width:canvas.width,height:canvas.height};
  });
}
