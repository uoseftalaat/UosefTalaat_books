import puppeteer from 'puppeteer-core';
import path from 'path';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:8088/', { waitUntil: 'networkidle0' });

  // 0. Capture Hero
  const heroEl = await page.$('#hero');
  if (heroEl) {
    await heroEl.screenshot({ path: 'screenshot-hero.png' });
    console.log('Saved screenshot-hero.png');
  }

  // 1. Capture About + YouTube
  const aboutEl = await page.$('#about');
  if (aboutEl) {
    await aboutEl.screenshot({ path: 'screenshot-about.png' });
    console.log('Saved screenshot-about.png');
  }

  // 2. Capture Currently Reading
  const currEl = await page.$('#currently-reading');
  if (currEl) {
    await currEl.screenshot({ path: 'screenshot-currently.png' });
    console.log('Saved screenshot-currently.png');
  }

  // 3. Capture 5-Star 3D Slider
  const sliderEl = await page.$('#top-books');
  if (sliderEl) {
    await sliderEl.screenshot({ path: 'screenshot-slider.png' });
    console.log('Saved screenshot-slider.png');
  }

  // Hide fixed header for clean section screenshots
  await page.evaluate(() => {
    const h = document.querySelector('#site-header');
    if (h) h.style.display = 'none';
  });

  // 4. Capture Catalog Card Closeup
  const cardEl = await page.$('.catalog-book-card');
  if (cardEl) {
    await cardEl.screenshot({ path: 'screenshot-card-closeup.png' });
    console.log('Saved screenshot-card-closeup.png');
  }

  // 5. Capture All Books Catalog (scroll through to trigger lazy load)
  const catalogEl = await page.$('#all-books');
  if (catalogEl) {
    await page.evaluate(async () => {
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise(r => setTimeout(r, 600));
      window.scrollTo(0, document.querySelector('#all-books').offsetTop);
      await new Promise(r => setTimeout(r, 600));
      // Force load all visible images
      const imgs = Array.from(document.querySelectorAll('#all-books img'));
      await Promise.all(imgs.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }));
    });
    await catalogEl.screenshot({ path: 'screenshot-catalog.png' });
    console.log('Saved screenshot-catalog.png');
  }

  // 6. Capture Mobile Viewport (390 x 844)
  await page.setViewport({ width: 390, height: 844, isMobile: true });
  await page.goto('http://localhost:8088/', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'screenshot-mobile.png' });
  console.log('Saved screenshot-mobile.png');

  await browser.close();
}

main().catch(console.error);
