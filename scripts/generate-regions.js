import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const regions = [
  { code: 'in', country: 'India', currency: 'INR', lang: 'en-IN' },
  { code: 'us', country: 'United States', currency: 'USD', lang: 'en-US' },
  { code: 'uk', country: 'United Kingdom', currency: 'GBP', lang: 'en-GB' },
  { code: 'ae', country: 'UAE', currency: 'AED', lang: 'en-AE' },
  { code: 'eu', country: 'Europe', currency: 'EUR', lang: 'en-IE' },
  { code: 'au', country: 'Australia', currency: 'AUD', lang: 'en-AU' },
  { code: 'ca', country: 'Canada', currency: 'CAD', lang: 'en-CA' },
  { code: 'sg', country: 'Singapore', currency: 'SGD', lang: 'en-SG' },
];

const distPath = path.resolve(__dirname, '../dist');
const indexHtmlPath = path.join(distPath, 'index.html');

if (!fs.existsSync(indexHtmlPath)) {
  console.error('dist/index.html not found. Run build first.');
  process.exit(1);
}

const originalHtml = fs.readFileSync(indexHtmlPath, 'utf-8');

for (const region of regions) {
  const regionDir = path.join(distPath, region.code);
  if (!fs.existsSync(regionDir)) {
    fs.mkdirSync(regionDir, { recursive: true });
  }

  // Replace SEO tags
  let html = originalHtml;
  html = html.replace('<html lang="en">', `<html lang="${region.lang}">`);
  html = html.replace(/<title>(.*?)<\/title>/, `<title>SplitBill ${region.country} - $1</title>`);
  
  // Inject window.__REGION__ config for the client app to pick up default currency
  html = html.replace(
    '</head>',
    `  <script>window.__REGION__ = ${JSON.stringify(region)};</script>\n  </head>`
  );

  fs.writeFileSync(path.join(regionDir, 'index.html'), html);
  console.log(`Generated region: /${region.code}/`);
}

// Generate sitemap.xml
let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://splitbill.techfliq.com/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
`;

for (const region of regions) {
  sitemap += `  <url>
    <loc>https://splitbill.techfliq.com/${region.code}/</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
}
sitemap += `</urlset>`;

fs.writeFileSync(path.join(distPath, 'sitemap.xml'), sitemap);
console.log('Generated sitemap.xml');
