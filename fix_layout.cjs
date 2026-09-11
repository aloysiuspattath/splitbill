const fs = require('fs');

// 1. ReviewReceiptStep.tsx
let rrFile = fs.readFileSync('src/pages/ReviewReceiptStep.tsx', 'utf8');
rrFile = rrFile.replace(
  /<div className="max-w-md mx-auto px-4 py-4 space-y-5">/,
  `<div className="max-w-md lg:max-w-5xl mx-auto px-4 py-4 lg:grid lg:grid-cols-12 lg:gap-12 lg:items-start">
      <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-24 mb-6 lg:mb-0">`
);

rrFile = rrFile.replace(
  /\{\/\* Modern Receipt Card \*\/\}/,
  `</div>
      <div className="lg:col-span-7 space-y-5">
      {/* Modern Receipt Card */}`
);

rrFile = rrFile.replace(
  /\{\/\* Bottom Sticky Action Buttons \*\/\}/,
  `</div>
      {/* Bottom Sticky Action Buttons */}
      <div className="lg:col-span-12">`
);

// close the new cols (a quick hack, just replace the final </div>)
// Let's replace the last </div>
let lastIndexRR = rrFile.lastIndexOf('</div>');
rrFile = rrFile.substring(0, lastIndexRR) + '</div>\n    </div>' + rrFile.substring(lastIndexRR + 6);

fs.writeFileSync('src/pages/ReviewReceiptStep.tsx', rrFile);

// 2. AssignStep.tsx
let asFile = fs.readFileSync('src/pages/AssignStep.tsx', 'utf8');
asFile = asFile.replace(
  /<div className="max-w-md mx-auto px-4 py-4 space-y-4">/,
  `<div className="max-w-md lg:max-w-6xl mx-auto px-4 py-4 lg:grid lg:grid-cols-12 lg:gap-12 lg:items-start">
      <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24 mb-6 lg:mb-0">`
);

asFile = asFile.replace(
  /\{\/\* Item Assignment Cards \*\/\}/,
  `</div>
      <div className="lg:col-span-8 space-y-4">
      {/* Item Assignment Cards */}`
);

asFile = asFile.replace(
  /\{\/\* Navigation Buttons \*\/\}/,
  `</div>
      {/* Navigation Buttons */}
      <div className="lg:col-span-12">`
);

let lastIndexAS = asFile.lastIndexOf('</div>');
asFile = asFile.substring(0, lastIndexAS) + '</div>\n    </div>' + asFile.substring(lastIndexAS + 6);

fs.writeFileSync('src/pages/AssignStep.tsx', asFile);
