const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const root = path.resolve(__dirname, '..');

(async () => {
  const browser = await chromium.launch({ channel: 'chromium', headless: true });
  try {
    const page = await browser.newPage();
    const source = 'data:image/png;base64,' + fs.readFileSync(path.join(root, 'store/source.png')).toString('base64');
    const iconSource = 'data:image/svg+xml;base64,' + fs.readFileSync(path.join(root, 'icons/icon.svg')).toString('base64');
    const images = await page.evaluate(async ({ source, iconSource }) => {
      const image = new Image();
      image.src = source;
      await image.decode();
      const icon = new Image();
      icon.src = iconSource;
      await icon.decode();
      const outputs = {};
      function make(name, width, height, draw) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, width, height);
        ctx.imageSmoothingQuality = 'high';
        draw(ctx);
        outputs[name] = canvas.toDataURL('image/png').split(',')[1];
      }
      function text(ctx, label, x, y, size, bold = false, color = '#171717') {
        ctx.fillStyle = color;
        ctx.font = `${bold ? 600 : 400} ${size}px Arial`;
        ctx.fillText(label, x, y);
      }
      function connector(ctx, points) {
        ctx.strokeStyle = '#b4b4b4';
        ctx.lineWidth = 1;
        ctx.beginPath();
        points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
        ctx.stroke();
      }
      make('store/screenshot-1280x800.png', 1280, 800, ctx => {
        // Keep the complete sidebar: the zoom is visibly tied to its bottom corner.
        ctx.drawImage(image, 0, 0, 475, 933, 32, 32, 375, 736);
        text(ctx, 'Codex limits', 480, 205, 48, true);
        text(ctx, 'in your sidebar', 480, 265, 48, true);
        text(ctx, 'Remaining usage and reset times.', 480, 320, 24, false, '#606060');
        connector(ctx, [[385, 722], [442, 722], [442, 522], [480, 522]]);
        ctx.drawImage(image, 16, 820, 438, 104, 480, 435, 728, 173);
      });
      make('store/promo-440x280.png', 440, 280, ctx => {
        ctx.drawImage(image, 0, 0, 475, 933, 8, 8, 134, 264);
        text(ctx, 'Codex limits', 160, 50, 26, true);
        text(ctx, 'in your sidebar', 160, 83, 26, true);
        text(ctx, 'Usage left · Reset time', 160, 117, 15, false, '#606060');
        connector(ctx, [[135, 255], [151, 255], [151, 194], [162, 194]]);
        ctx.drawImage(image, 238, 829, 211, 89, 162, 144, 260, 110);
      });
      for (const size of [16, 32, 48, 128]) {
        make(`icons/icon-${size}.png`, size, size, ctx => {
          ctx.clearRect(0, 0, size, size);
          ctx.drawImage(icon, 0, 0, size, size);
        });
      }
      return outputs;
    }, { source, iconSource });
    for (const [name, data] of Object.entries(images)) {
      fs.writeFileSync(path.join(root, name), Buffer.from(data, 'base64'));
      console.log(name);
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
