const fs = require('fs');
const data = JSON.parse(fs.readFileSync('antibiotics_crm.json', 'utf8'));

function parseExcelDate(val, val2) {
  if (val === null || val === undefined || val === '') return null;
  val = String(val).trim();
  if (/^\d+(\.\d+)?$/.test(val)) {
    const num = parseFloat(val);
    if (num > 30000 && num < 60000) {
      const date = new Date(Math.round((num - 25569) * 86400 * 1000));
      return date.toISOString().split('T')[0];
    }
  }
  if (val2 && /^\d+(\.\d+)?$/.test(String(val2).trim())) {
    const num = parseFloat(val2);
    if (num > 30000 && num < 60000) {
      const date = new Date(Math.round((num - 25569) * 86400 * 1000));
      return date.toISOString().split('T')[0];
    }
  }
  let s = val.replace(/\s+/g, '.').replace(/[\/-]/g, '.');
  let match = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
  if (match) {
    let d = parseInt(match[1], 10);
    let m = parseInt(match[2], 10);
    let y = parseInt(match[3], 10);
    if (y < 100) y += 2000;
    const pad = (n) => String(n).padStart(2, '0');
    return ${y}--;
  }
  return null;
}

let unparsed = 0;
data.forEach((item, idx) => {
  const p = parseExcelDate(item.rawExpiry, item.expiryValue2);
  if (!p) {
    console.log('Failed:', item);
    unparsed++;
  }
});
console.log('Total items:', data.length, 'Unparsed:', unparsed);