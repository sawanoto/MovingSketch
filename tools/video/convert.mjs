import {execFileSync} from 'node:child_process';
export function convert(input, output) {
  execFileSync('ffmpeg',['-y','-i',input,'-vf',
    'scale=1080:1920:force_original_aspect_ratio=decrease:force_divisible_by=2:out_range=tv,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=0xfaf9f5,setsar=1,fps=30',
    '-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p',
    '-color_range','tv','-c:a','aac','-b:a','192k','-ar','48000','-movflags','+faststart',output],{stdio:['ignore','ignore','pipe']});
}
export function probe(path) {
  return JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',path],{encoding:'utf8'}));
}
