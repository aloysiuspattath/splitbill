import { describe, it, expect } from 'vitest';
import { parseReceiptText } from './ReceiptParser';

describe('ReceiptParser Multi-Format Validation Suite', () => {
  // 1. Indian Restaurant / GST Receipt with multi-line items
  it('parses Indian GST receipt (Sulthan Veedu style) with 100% precision', () => {
    const rawText = `
SULTHAN VEEDU RESTAURANT
METRO PILLAR NO : 115
COMPANYPADY , ALUVA
PH:7902922777
GSTIN:32AAFFO8310A1ZX
Date: 04/09/26 Dine In: 22
21:30
Cashier: JINS Bill No.: 205092
Item Qty. Price Amount
Erachi Choru Beef 2 240.00 480.00
Lebanese Al 1 370.00 370.00
Faham (Half)
Beef Rib Grilled 1 295.00 295.00
(Qtr)
Pal Kappa With 1 349.00 349.00
Beef
Ginger Lime Juice 1 40.00 40.00
Fresh Lime Juice 2 40.00 80.00
KUBOOS 2 12.00 24.00
Total Qty: 10 Sub Total 1638.00
CGST 2.5% 40.95
SGST 2.5% 40.95
Round off +0.10
Grand Total 1720.00
FSSAI Lic No. 11322007001922
"THUMHARI KHWAHISH HAMARA HUKUM"
`;

    const result = parseReceiptText(rawText, 'INR');

    expect(result.restaurantName).toBe('Sulthan Veedu Restaurant');
    expect(result.items.length).toBe(7);

    expect(result.items[0].name).toBe('Erachi Choru Beef');
    expect(result.items[0].quantity).toBe(2);
    expect(result.items[0].totalPricePaise).toBe(48000);

    expect(result.items[1].name).toBe('Lebanese Al Faham (Half)');
    expect(result.items[1].quantity).toBe(1);
    expect(result.items[1].totalPricePaise).toBe(37000);

    expect(result.items[2].name).toBe('Beef Rib Grilled (Qtr)');
    expect(result.items[2].quantity).toBe(1);
    expect(result.items[2].totalPricePaise).toBe(29500);

    expect(result.items[3].name).toBe('Pal Kappa With Beef');
    expect(result.items[3].quantity).toBe(1);
    expect(result.items[3].totalPricePaise).toBe(34900);

    expect(result.items[6].name).toBe('KUBOOS');
    expect(result.items[6].quantity).toBe(2);
    expect(result.items[6].totalPricePaise).toBe(2400);

    const calculatedSubtotal = result.items.reduce((s, it) => s + it.totalPricePaise, 0);
    expect(calculatedSubtotal).toBe(163800); // exactly 1638.00

    expect(result.detectedTaxes.length).toBe(2);
    expect(result.detectedTaxes[0].name).toBe('CGST');
    expect(result.detectedTaxes[0].rate).toBe(2.5);
    expect(result.detectedTaxes[1].name).toBe('SGST');
    expect(result.detectedTaxes[1].rate).toBe(2.5);

    expect(result.detectedTotalPaise).toBe(172000);
  });

  // 2. US Cafe / Bakery Receipt with leading quantity (e.g. "1 Avocado Toast 14.50")
  it('parses US cafe receipt with leading quantities and Sales Tax', () => {
    const rawText = `
BLUE BOTTLE COFFEE
123 Market St, San Francisco, CA
Server: Alex
Table: 4
1 Avocado Toast 14.50
2 Iced Latte 5.50 11.00
1 Blueberry Muffin 4.25
Subtotal 29.75
Sales Tax 8.5% 2.53
Total 32.28
Tip 18% 5.35
Thank you for visiting!
`;

    const result = parseReceiptText(rawText, 'USD');

    expect(result.items.length).toBe(3);
    expect(result.items[0].name).toBe('Avocado Toast');
    expect(result.items[0].quantity).toBe(1);
    expect(result.items[0].totalPricePaise).toBe(1450);

    expect(result.items[1].name).toBe('Iced Latte');
    expect(result.items[1].quantity).toBe(2);
    expect(result.items[1].totalPricePaise).toBe(1100);

    expect(result.items[2].name).toBe('Blueberry Muffin');
    expect(result.items[2].quantity).toBe(1);
    expect(result.items[2].totalPricePaise).toBe(425);

    expect(result.detectedSubtotalPaise).toBe(2975);
    expect(result.detectedTotalPaise).toBe(3228);
  });

  // 3. Serial-numbered format: "1. Butter Chicken 1 380.00 380.00"
  it('parses receipts with item serial numbers (1., 2., 3.) without mixing with quantity', () => {
    const rawText = `
COPPER CHIMNEY RESTAURANT
Order No: 489
1. Butter Chicken 1 380.00 380.00
2. Garlic Naan 4 60.00 240.00
3. Jeera Rice 1 180.00 180.00
Subtotal 800.00
CGST 2.5% 20.00
SGST 2.5% 20.00
Total 840.00
`;

    const result = parseReceiptText(rawText, 'INR');

    expect(result.items.length).toBe(3);
    expect(result.items[0].name).toBe('Butter Chicken');
    expect(result.items[0].quantity).toBe(1);
    expect(result.items[0].totalPricePaise).toBe(38000);

    expect(result.items[1].name).toBe('Garlic Naan');
    expect(result.items[1].quantity).toBe(4);
    expect(result.items[1].totalPricePaise).toBe(24000);

    expect(result.items[2].name).toBe('Jeera Rice');
    expect(result.items[2].quantity).toBe(1);
    expect(result.items[2].totalPricePaise).toBe(18000);
  });

  // 4. Fast-food style with "2x Burger" format
  it('parses fast food style receipts with "2x" quantity indicators', () => {
    const rawText = `
SHAKE SHACK
Order: #104
Cashier: Sarah
2x ShackBurger 6.99 13.98
1x Cheese Fries 4.49
2x Fifty/Fifty 2.99 5.98
Subtotal 24.45
Tax 8.25% 2.02
Total Due 26.47
`;

    const result = parseReceiptText(rawText, 'USD');

    expect(result.items.length).toBe(3);
    expect(result.items[0].name).toBe('ShackBurger');
    expect(result.items[0].quantity).toBe(2);
    expect(result.items[0].totalPricePaise).toBe(1398);

    expect(result.items[1].name).toBe('Cheese Fries');
    expect(result.items[1].quantity).toBe(1);
    expect(result.items[1].totalPricePaise).toBe(449);
  });

  // 5. Simple single-column prices (Item Name + Price only)
  it('parses simple bills with Item Name followed by single price', () => {
    const rawText = `
PIZZERIA DELLA NONNA
Table 12
Margherita Pizza 450.00
Truffle Fries 220.00
Sparkling Water 90.00
Subtotal 760.00
GST 5% 38.00
Total 798.00
`;

    const result = parseReceiptText(rawText, 'INR');

    expect(result.items.length).toBe(3);
    expect(result.items[0].name).toBe('Margherita Pizza');
    expect(result.items[0].quantity).toBe(1);
    expect(result.items[0].totalPricePaise).toBe(45000);

    expect(result.items[1].name).toBe('Truffle Fries');
    expect(result.items[1].quantity).toBe(1);
    expect(result.items[1].totalPricePaise).toBe(22000);

    expect(result.items[2].name).toBe('Sparkling Water');
    expect(result.items[2].quantity).toBe(1);
    expect(result.items[2].totalPricePaise).toBe(9000);
  });

  // 6. Service Charge & VAT format (e.g. Dubai / UK)
  it('parses Service Charge and VAT percentages accurately', () => {
    const rawText = `
AL SAFADI RESTAURANT
Dubai, UAE
Chicken Shawarma 28.00
Hummus with Meat 32.00
Fattoush Salad 24.00
Subtotal 84.00
Service Charge 10% 8.40
VAT 5% 4.62
Grand Total 97.02
`;

    const result = parseReceiptText(rawText, 'AED');

    expect(result.items.length).toBe(3);
    expect(result.detectedTaxes.length).toBe(2);
    expect(result.detectedTaxes[0].name).toBe('SERVICE CHARGE');
    expect(result.detectedTaxes[0].rate).toBe(10);
    expect(result.detectedTaxes[1].name).toBe('VAT');
    expect(result.detectedTaxes[1].rate).toBe(5);
    expect(result.detectedTotalPaise).toBe(9702);
  });

  // 7. Kerala Restaurant / Ifthar style bill with Rate-QTY-Amount column order
  it('parses Ifthar restaurant bill with Rate QTY Amount columns', () => {
    const rawText = `
\\ IF THAR
'The Real Taste Of Malabar'
9633624533
GSTIN :32AAGFI6187C1ZJ
BILL NO :0055178
Date :31-08-2026 Time:08.48 PM
Ctr :Ifthar Staff:5
ITEM NAME Rate QTY Amount
KUTTI PUT 33.10 1 33.10
KERALA POROTTA 17.15 4 68.60
VELLAYAPPAM 14.29 2 28.58
BEEF COCONUT 180.96 2 361.92
CKN NADAN CURRY 142.86 1 142.86
LIME TEA 16.20 2 32.40
CHAI 17.15 1 17.15
TOTAL : 13 684.61
CGST(2.50%) : 17.115
SGST(2.50%) : 17.115
TOTAL PAYABLE : 719.00
# 7 Item(s) For 0 People #
`;

    const result = parseReceiptText(rawText, 'INR');

    expect(result.restaurantName).toMatch(/IF\s*THAR|IFTHAR/i);
    expect(result.items.length).toBe(7);

    expect(result.items[0].name).toBe('KUTTI PUT');
    expect(result.items[0].quantity).toBe(1);
    expect(result.items[0].totalPricePaise).toBe(3310);

    expect(result.items[1].name).toBe('KERALA POROTTA');
    expect(result.items[1].quantity).toBe(4);
    expect(result.items[1].totalPricePaise).toBe(6860);

    expect(result.items[2].name).toBe('VELLAYAPPAM');
    expect(result.items[2].quantity).toBe(2);
    expect(result.items[2].totalPricePaise).toBe(2858);

    expect(result.items[3].name).toBe('BEEF COCONUT');
    expect(result.items[3].quantity).toBe(2);
    expect(result.items[3].totalPricePaise).toBe(36192);

    expect(result.items[4].name).toBe('CKN NADAN CURRY');
    expect(result.items[4].quantity).toBe(1);
    expect(result.items[4].totalPricePaise).toBe(14286);

    expect(result.items[5].name).toBe('LIME TEA');
    expect(result.items[5].quantity).toBe(2);
    expect(result.items[5].totalPricePaise).toBe(3240);

    expect(result.items[6].name).toBe('CHAI');
    expect(result.items[6].quantity).toBe(1);
    expect(result.items[6].totalPricePaise).toBe(1715);

    expect(result.detectedSubtotalPaise).toBe(68461);
    expect(result.detectedTotalPaise).toBe(71900);
  });
});
