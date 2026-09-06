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

  // 8. Real-world Indian Restaurant Bill (Hotel Vishwanand Navi Mumbai)
  it('parses real-world Hotel Vishwanand bill with GST, items, and OCR noise', () => {
    const rawText = `
_— HOTEL VISHWANAND
\\ Om Chanakya CHS Ltd,Sec:6
CBD Belapur,Navi Mumbai
Ph: 9653245007, 9082331031
Ee TAX INVOICE ---=c-a------
- Date : 28/01/26 Bill No. : 13
1480. 21 ow a2
Particulars Qty Rate Amount
VEG BIRYANI hg © 192.38
TRIPLE SEZ FRIED RICE 1 200 200
MISAL PAV Pay 1/6.19
COLD DRINKS 200ML ra. 1:23.81
COLD DRINKS SOOML 147.62 47.62
: Sub Total : 500.00 |
SGST @2.5% : 12.50
CGST @2.5% : 12.50
Food Total : 525 0
Total : 525
`;

    const result = parseReceiptText(rawText, 'INR');

    expect(result.restaurantName).toBe('HOTEL VISHWANAND');
    expect(result.items.length).toBe(5);

    expect(result.items[0].name).toBe('VEG BIRYANI');
    expect(result.items[0].totalPricePaise).toBe(19238);

    expect(result.items[1].name).toBe('TRIPLE SEZ FRIED RICE');
    expect(result.items[1].quantity).toBe(1);
    expect(result.items[1].totalPricePaise).toBe(20000);

    expect(result.items[2].name).toBe('MISAL PAV');
    expect(result.items[2].quantity).toBe(1);
    expect(result.items[2].totalPricePaise).toBe(7619);

    expect(result.items[3].name).toBe('COLD DRINKS 200ML');
    expect(result.items[3].quantity).toBe(1);
    expect(result.items[3].totalPricePaise).toBe(2381);

    expect(result.items[4].name).toBe('COLD DRINKS 500ML');
    expect(result.items[4].quantity).toBe(1);
    expect(result.items[4].totalPricePaise).toBe(4762);

    expect(result.detectedSubtotalPaise).toBe(50000);
    expect(result.detectedTotalPaise).toBe(52500);
  });

  // 9. Real-world US Fine Dining Bill (Boulevard San Francisco)
  it('parses real-world Boulevard SF receipt with dinner course codes and wine fractions', () => {
    const rawText = `
BOULEVARD
ONE MISSION STREET
SAN FRANCISCO, CA 94105
(415) 543-6084
DINING ROOM
1019 KEN
Toi 64/1 Chk 9458 6st 2
Feb15’06 07:20PM
1 HENDRIKS 8.00
1 BOURBON MANHATN 8.75
1D SOUP. 13.75
1D ABALONE 19.50
1.0 LOBSTER LINGUT 18.75
1D SHORTRIB 17.50
1D SHEETBREADS 17.25
10 LAMB 32.00
10 PORK 31.00
11/2 6L-3 SAINTS PN 5.50
11/2 GL SAWY BLANC 4.25
11/2 GL-BAROLO 9.75
11/2 G- UNTT SYRAH 5.50
1 POTRERD 10.50
1 G-CASTELNAY 9.00
1D BANANAS FOSTER 9.50
10 TRIO 9.75
SUBTOTAL 230.25
Tax 19.57
Total 249.32
BOULEVARD COOKBOOKS ARE NOW AVAILABLE
`;

    const result = parseReceiptText(rawText, 'USD');

    expect(result.restaurantName).toBe('BOULEVARD');
    expect(result.items.length).toBe(17);

    // Verify fine dining course code items had Qty 1 and clean names
    const soup = result.items.find(it => it.name.includes('SOUP'));
    expect(soup).toBeDefined();
    expect(soup?.quantity).toBe(1);
    expect(soup?.totalPricePaise).toBe(1375);

    const lamb = result.items.find(it => it.name === 'LAMB');
    expect(lamb).toBeDefined();
    expect(lamb?.quantity).toBe(1);
    expect(lamb?.totalPricePaise).toBe(3200);

    // Verify wine glass fractions were parsed
    const barolo = result.items.find(it => it.name.includes('BAROLO'));
    expect(barolo).toBeDefined();
    expect(barolo?.quantity).toBe(1);
    expect(barolo?.totalPricePaise).toBe(975);

    expect(result.detectedSubtotalPaise).toBe(23025);
    expect(result.detectedTotalPaise).toBe(24932);
    expect(result.detectedTaxes[0].name).toBe('TAX');
  });

  // 10. Real-world European / Swiss Alps Bill (Berghotel Grosse Scheidegg)
  it('parses real-world Swiss restaurant receipt with attached quantities, à pricing, and MwSt', () => {
    const rawText = `
Berghotel
Grosse Scheidegg
3818 Grindelwald
Familie R. Müller
Rech. Nr. 4572 30.07.2007/13:29:17
Bar Tisch 7/01
2xLatte Macchiato à 4.50 CHF 9.00
1xGloki à 5.00 CHF 5.00
1xSchweinschnitzel à 22.00 CHF 22.00
1xChässpätzli à 18.50 CHF 18.50
Total : CHF 54.50
Incl. 7.6% MwSt 54.50 CHF: 3.85
`;

    const result = parseReceiptText(rawText, 'CHF');

    expect(result.restaurantName).toContain('Berghotel');
    expect(result.items.length).toBe(4);

    expect(result.items[0].name).toBe('Latte Macchiato');
    expect(result.items[0].quantity).toBe(2);
    expect(result.items[0].unitPricePaise).toBe(450);
    expect(result.items[0].totalPricePaise).toBe(900);

    expect(result.items[1].name).toBe('Gloki');
    expect(result.items[1].quantity).toBe(1);
    expect(result.items[1].totalPricePaise).toBe(500);

    expect(result.items[2].name).toBe('Schweinschnitzel');
    expect(result.items[2].quantity).toBe(1);
    expect(result.items[2].totalPricePaise).toBe(2200);

    expect(result.items[3].name).toBe('Chässpätzli');
    expect(result.items[3].quantity).toBe(1);
    expect(result.items[3].totalPricePaise).toBe(1850);

    expect(result.detectedTotalPaise).toBe(5450);
    expect(result.detectedTaxes[0].name).toBe('MWST');
    expect(result.detectedTaxes[0].rate).toBe(7.6);
  });
});

