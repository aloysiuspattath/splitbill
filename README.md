# 🧾 SplitBill
> **Free, private & open bill splitter. Zero data collected.**

SplitBill is a progressive, offline-first web application designed to make splitting restaurant bills and group expenses as frictionless as possible. It features a fully local, WebAssembly-powered receipt scanner, multi-currency support, and mathematically rigorous debt-minimization algorithms for group trips—all without requiring a server or an account.

![SplitBill Hero](https://splitbill.techfliq.com/apple-touch-icon.png)

## ✨ Features

- **100% Offline & Private**: Everything runs locally on your device. Receipts are processed on your browser using Tesseract.js (WebAssembly) and data is stored in IndexedDB. Nothing is ever sent to a server.
- **Smart Receipt Scanning**: Take a picture of your receipt and tap to assign items to friends. 
- **Global i18n & Multi-Currency**: Fully localized into 16 languages and regions. Instantly switches currency and language via instantaneous SPA routing.
- **Group Trips**: Track multi-bill expenses and use the built-in debt-minimization algorithm to figure out exactly "who owes who" with the fewest number of transactions.
- **PWA (Progressive Web App)**: Installable on iOS and Android. Works perfectly on airplane mode or in basements with zero reception.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)

### Installation
1. Clone the repository
   ```bash
   git clone https://github.com/aloysiuspattath/splitbill.git
   cd splitbill
   ```
2. Install dependencies
   ```bash
   npm install
   ```
3. Start the development server
   ```bash
   npm run dev
   ```

### Building for Production
```bash
npm run build
```
This will compile the React app, generate the Service Worker for offline capability, and run the `generate-regions.js` script to statically render all internationalized HTML entry points for maximum SEO.

## 🤝 Support the Project

SplitBill is offered 100% free with no ads and no tracking. If you find it useful, consider buying the creator a coffee to help cover domain and hosting costs!

<a href="https://buymeacoffee.com/aloyziuz" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

## 📄 License
This project is legally protected under the **GNU General Public License v3.0 (GPLv3)**. 

If you fork, modify, or distribute this software, you **must** release your modified version as open-source under the same GPLv3 license. This ensures the tool remains forever free and protects user privacy from closed-source corporate exploitation. See the `LICENSE` file for more details.

### ⚖️ Attribution & Forking
If you fork and host a public version of this application, you must provide clear attribution to the original creator:
1. Retain the Copyright notice and creator attribution in the footer of the application.
2. Provide a link back to this original GitHub repository.

---
*Crafted with ❤️ by Aloysius Pattath*
