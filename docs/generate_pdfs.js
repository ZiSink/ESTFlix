'use strict';
const puppeteer = require('puppeteer-core');
const path      = require('path');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DOCS   = path.join(__dirname);

const files = [
  { html: 'manual_tecnico.html',    pdf: 'Manual_Tecnico_ESTFlix.pdf'    },
  { html: 'manual_utilizador.html', pdf: 'Manual_Utilizador_ESTFlix.pdf' }
];

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
  const page    = await browser.newPage();

  for (const { html, pdf } of files) {
    const url  = 'file:///' + path.join(DOCS, html).replace(/\\/g, '/');
    const dest = path.join(DOCS, pdf);
    await page.goto(url, { waitUntil: 'networkidle0' });
    await page.pdf({
      path:   dest,
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' }
    });
    console.log('Gerado:', pdf);
  }

  await browser.close();
  console.log('Concluído.');
})();
