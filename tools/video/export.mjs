import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {openWork} from './browser.mjs';
import {record} from './record.mjs';
import {convert,probe} from './convert.mjs';
const root = fileURLToPath(new URL('../../',import.meta.url)).replace(/\/$/,'');
const out = resolve(process.argv[2] || resolve(root,'video-output'));
await mkdir(out,{recursive:true});
const work = await openWork(root,'LifeSketch/001_doremi-pipes');
try {
  const take = await record(work.page);
  if (work.errors.length) throw new Error(work.errors.join('\n'));
  const intermediate = resolve(out,'001_doremi-pipes.webm');
  const output = resolve(out,'001_doremi-pipes.mp4');
  await writeFile(intermediate,Buffer.from(take.base64,'base64'));
  convert(intermediate,output);
  const metadata = probe(output);
  const {base64,...report} = take;
  await writeFile(resolve(out,'report.json'),JSON.stringify({...report,metadata},null,2));
  console.log(JSON.stringify({output,duration:metadata.format.duration,bytes:metadata.format.size,notes:take.log.length},null,2));
} finally {await work.close();}
