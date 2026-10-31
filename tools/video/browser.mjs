import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve, extname, sep} from 'node:path';

export async function openWork(root, workPath) {
  const server = createServer(async (req, res) => {
    const path = resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (!path.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    try {
      const body = await readFile(req.url.split('?')[0].endsWith('/') ? path + '/index.html' : path);
      res.setHeader('Content-Type', ({'.js':'text/javascript','.html':'text/html','.css':'text/css','.mp4':'video/mp4'})[extname(path) || '.html'] || 'application/octet-stream');
      res.end(body);
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({headless:true,
      ...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {}),
      args:['--autoplay-policy=no-user-gesture-required','--disable-background-timer-throttling']});
    const page = await browser.newPage({viewport:{width:1080,height:1000},deviceScaleFactor:1});
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/${workPath}/?demo&capture`);
    await page.waitForFunction(() => window.doremiDemo && document.querySelector('canvas') && typeof marpan !== 'undefined' && marpan);
    return {page, errors, close:async () => {await browser.close(); await new Promise(resolve => server.close(resolve));}};
  } catch (error) {
    await browser?.close(); server.close(); throw error;
  }
}
