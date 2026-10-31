// Publish the existing MP4 only. Never regenerate it or overwrite a tag/release.
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {probe} from './convert.mjs';
const repo='sawanoto/MovingSketch';
const branch='codex/lifesketch-cloud-start';
const tag='lifesketch-001-video-v1';
const title='LIFESketch #001 ドレミパイプ — Instagram Video';
const root=fileURLToPath(new URL('../../',import.meta.url));
const mp4=resolve(process.argv[2] || join(root,'video-output/001_doremi-pipes.mp4'));
const gh=(...args)=>execFileSync('gh',args,{encoding:'utf8',stdio:['ignore','pipe','pipe']});
const api=path=>JSON.parse(gh('api',path));
try {
  const bytes=readFileSync(mp4);
  const sha256=createHash('sha256').update(bytes).digest('hex');
  const metadata=probe(mp4), v=metadata.streams.find(s=>s.codec_type==='video'), a=metadata.streams.find(s=>s.codec_type==='audio');
  if (v?.codec_name!=='h264' || v.width!==1080 || v.height!==1920 || v.r_frame_rate!=='30/1' || a?.codec_name!=='aac') throw new Error('Unexpected MP4 format');
  if (Math.abs(Number(metadata.format.duration)-19.066667)>.1) throw new Error('Unexpected duration');
  const repository=api(`repos/${repo}`);
  if (repository.visibility!=='public' || repository.private) throw new Error('Repository is not public');
  if (!repository.permissions?.push) throw new Error('GitHub write permission unavailable');
  const refs=api(`repos/${repo}/git/matching-refs/tags/${tag}`);
  if (refs.some(r=>r.ref===`refs/tags/${tag}`)) throw new Error('Tag already exists; refusing to overwrite');
  const pages=JSON.parse(gh('api',`repos/${repo}/releases?per_page=100`,'--paginate','--slurp'));
  if (pages.flat().some(r=>r.tag_name===tag)) throw new Error('Release already exists; refusing to overwrite');
  const target=api(`repos/${repo}/branches/${branch}`).commit.sha;
  const temp=mkdtempSync(join(tmpdir(),'lifesketch-release-'));
  try {
    const notes=join(temp,'notes.md');
    writeFileSync(notes,`${title}\n\nExisting video; no regeneration or content changes.\n\n- Source branch: ${branch}\n- Source commit: ${target}\n- Duration: ${metadata.format.duration} seconds\n- Format: 1080 × 1920, 30fps, H.264 / AAC\n- Size: ${bytes.length} bytes\n- SHA-256: ${sha256}\n`);
    console.log(gh('release','create',tag,mp4+'#001_doremi-pipes.mp4','--repo',repo,'--target',target,'--title',title,'--notes-file',notes,'--latest=false').trim());
  } finally {rmSync(temp,{recursive:true,force:true});}
  console.log(gh('release','view',tag,'--repo',repo,'--json','url,assets'));
} catch(error) {
  // Print CLI errors, never credentials or the environment.
  console.error(error.stderr?.toString().trim() || error.message);
  process.exitCode=1;
}
