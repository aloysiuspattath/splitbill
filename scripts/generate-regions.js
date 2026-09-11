import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const regions = [
  // Existing English Regions
  { code: 'in', country: 'India', currency: 'INR', lang: 'en-IN' },
  { code: 'us', country: 'United States', currency: 'USD', lang: 'en-US' },
  { code: 'uk', country: 'United Kingdom', currency: 'GBP', lang: 'en-GB' },
  { code: 'ae', country: 'UAE', currency: 'AED', lang: 'en-AE' },
  { code: 'eu', country: 'Europe', currency: 'EUR', lang: 'en-IE' },
  { code: 'au', country: 'Australia', currency: 'AUD', lang: 'en-AU' },
  { code: 'ca', country: 'Canada', currency: 'CAD', lang: 'en-CA' },
  { code: 'sg', country: 'Singapore', currency: 'SGD', lang: 'en-SG' },
  
  // New International Markets
  { code: 'es', country: 'España', currency: 'EUR', lang: 'es-ES' },
  { code: 'mx', country: 'México', currency: 'MXN', lang: 'es-MX' },
  { code: 'br', country: 'Brasil', currency: 'BRL', lang: 'pt-BR' },
  { code: 'de', country: 'Deutschland', currency: 'EUR', lang: 'de-DE' },
  { code: 'jp', country: '日本', currency: 'JPY', lang: 'ja-JP' },
  { code: 'id', country: 'Indonesia', currency: 'IDR', lang: 'id-ID' },
  { code: 'fr', country: 'France', currency: 'EUR', lang: 'fr-FR' },
  { code: 'it', country: 'Italia', currency: 'EUR', lang: 'it-IT' },
];

const distPath = path.resolve(__dirname, '../dist');
const indexHtmlPath = path.join(distPath, 'index.html');

if (!fs.existsSync(indexHtmlPath)) {
  console.error('dist/index.html not found. Run build first.');
  process.exit(1);
}

const originalHtml = fs.readFileSync(indexHtmlPath, 'utf-8');

// Build Hreflang Cluster
let hreflangTags = `<link rel="alternate" hreflang="x-default" href="https://splitbill.techfliq.com/" />\n`;
hreflangTags += `<link rel="alternate" hreflang="en" href="https://splitbill.techfliq.com/" />\n`;
for (const region of regions) {
  hreflangTags += `    <link rel="alternate" hreflang="${region.lang}" href="https://splitbill.techfliq.com/${region.code}/" />\n`;
}

// 1. Update Root index.html
let rootHtml = originalHtml;
rootHtml = rootHtml.replace(
  '<!-- Primary SEO & SERP Directives -->',
  `<!-- Primary SEO & SERP Directives -->\n    ${hreflangTags}`
);
fs.writeFileSync(indexHtmlPath, rootHtml);

// 2. Generate Regional Folders
for (const region of regions) {
  const regionDir = path.join(distPath, region.code);
  if (!fs.existsSync(regionDir)) {
    fs.mkdirSync(regionDir, { recursive: true });
  }

  let html = originalHtml;
  
  // Hreflang Tags
  html = html.replace(
    '<!-- Primary SEO & SERP Directives -->',
    `<!-- Primary SEO & SERP Directives -->\n    ${hreflangTags}`
  );

  // Replace SEO tags
  html = html.replace('<html lang="en">', `<html lang="${region.lang}">`);
  
  // Fix Canonical to be self-referential
  const canonicalUrl = `https://splitbill.techfliq.com/${region.code}/`;
  html = html.replace(
    /<link rel="canonical" href="[^"]+" \/>/g, 
    `<link rel="canonical" href="${canonicalUrl}" />`
  );
  
  // OpenGraph URL and Locale
  html = html.replace(/<meta property="og:url" content="[^"]+" \/>/g, `<meta property="og:url" content="${canonicalUrl}" />`);
  html = html.replace(/<meta name="twitter:url" content="[^"]+" \/>/g, `<meta name="twitter:url" content="${canonicalUrl}" />`);
  html = html.replace(/<meta property="og:locale" content="[^"]+" \/>/g, `<meta property="og:locale" content="${region.lang.replace('-', '_')}" />`);

  html = html.replace(/<title>(.*?)<\/title>/, `<title>SplitBill ${region.country} - $1</title>`);
  
  // Inject window.__REGION__ config for the client app to pick up default currency
  html = html.replace(
    '</head>',
    `  <script>window.__REGION__ = ${JSON.stringify(region)};</script>\n  </head>`
  );

  fs.writeFileSync(path.join(regionDir, 'index.html'), html);
  console.log(`Generated region: /${region.code}/`);
}

// 3. Generate sitemap.xml preserving old static files
const staticPages = [
  { url: '', priority: '1.0' },
  { url: 'receipt-scanner.html', priority: '0.9' },
  { url: 'splitwise-alternative.html', priority: '0.9' },
  { url: 'guide/index.html', priority: '0.6' },
  { url: 'faq/index.html', priority: '0.6' },
  { url: 'terms/index.html', priority: '0.5' },
  { url: 'privacy/index.html', priority: '0.5' },
];

let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
`;

for (const page of staticPages) {
  sitemap += `  <url>
    <loc>https://splitbill.techfliq.com/${page.url}</loc>
    <changefreq>weekly</changefreq>
    <priority>${page.priority}</priority>
  </url>\n`;
}

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
