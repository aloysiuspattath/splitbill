# SplitBill — Mobile-First Restaurant Bill Splitter

> "Split your bill. No signup. No server. No cost."

SplitBill is a production-grade, 100% client-side web application and Progressive Web App (PWA) built to split restaurant bills fairly, accurately, and with zero headache.

---

## 🔒 Privacy & Operating Guarantees

1. **Zero Cost**: Completely free to operate forever.
2. **Zero Backend**: No backend server, no database server, and no cloud runtime required.
3. **Zero Tracking**: No user registration, no passwords, no analytics, no ads, and no cookies.
4. **Local OCR**: Receipts are processed directly in your browser using WebAssembly OCR. Images are never uploaded to any remote server.
5. **Private Storage**: Stored locally in IndexedDB on your device. Temporary bills automatically expire in 7 days unless pinned with "Keep Permanently".
6. **Data Portability**: Full JSON backup export and safe import with prototype pollution guards.

---

## 🚀 Key Features

- **Local Receipt OCR**: Snap a photo or upload an image to extract items, quantities, prices, taxes, and totals directly on-device.
- **Manual Bill Entry**: Fast, streamlined entry with full quantity and unit price support.
- **Unlimited Eaters**: Friendly avatars, color badges, and safe deletion guards.
- **Flexible Item Splitting**:
  - Assign to 1 person
  - Split equally among multiple friends
  - Split by custom percentages (with 100% total validation)
  - Split by custom amounts (with item price validation)
  - Supports duplicate item names as distinct line items (e.g. separate drinks)
- **Taxes & Counter Payment**:
  - Percentage taxes (e.g. CGST 2.5% + SGST 2.5%, VAT) or fixed taxes.
  - Automatic discount computation: enter what you actually paid at the counter (e.g. printed ₹1,720 vs paid ₹1,411).
  - Proportional, equal, or custom discount allocation.
  - Optional tip / gratuity allocation.
- **Deterministic Rounding Engine**:
  - All internal calculations performed in integer smallest units (paise/cents).
  - Largest Remainder (Hare-Niemeyer) algorithm guarantees `SUM(person shares) === actual amount paid` to the exact single paisa with zero discrepancy.
- **Export & Sharing**:
  - One-tap WhatsApp / SMS clean text summary.
  - Web Share API integration.
  - Download as high-resolution image ticket.
  - Browser-generated PDF receipt with itemized breakdown.
  - JSON export & import.
- **PWA & Offline Capable**: Works offline after initial load with service worker caching.
- **Dark Mode**: Supports Light, Dark, and System preference.
- **Multi-Currency**: INR (₹), USD ($), EUR (€), GBP (£), AED, SGD, AUD, CAD, JPY.

---

## 🛠️ Tech Stack

- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS (mobile-first, iOS-inspired card styling)
- **Icons**: Lucide React
- **Local Storage**: IndexedDB via `idb`
- **Client-Side OCR**: `tesseract.js` (lazy-loaded on demand)
- **PDF Generation**: `jspdf` + `jspdf-autotable`
- **Image Generation**: `html-to-image`
- **PWA**: `vite-plugin-pwa`
- **Testing**: `vitest`

---

## 🏃 Getting Started Locally

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Run automated calculation tests
npm test

# 4. Build production static bundle
npm run build
```

---

## ☁️ Cloudflare Pages Deployment

Because SplitBill has zero backend and builds into pure static assets, it can be deployed to Cloudflare Pages for free:

1. Push this repository to GitHub or GitLab.
2. In the Cloudflare Dashboard, go to **Workers & Pages** → **Create application** → **Pages**.
3. Connect your repository.
4. Set the build settings:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. Click **Save and Deploy**.

Your app is now live worldwide with zero server costs!
