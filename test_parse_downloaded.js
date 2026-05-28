const XLSX = require('xlsx');

const filepath = 'C:\\Users\\sures\\Downloads\\activity_logs_2026-05-28.xlsx';
console.log("Parsing:", filepath);

try {
  const workbook = XLSX.readFile(filepath);
  console.log("Sheet names:", workbook.SheetNames);

  const firstSheet = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheet];
  
  console.log("Sheet range:", sheet['!ref']);
  
  const data = XLSX.utils.sheet_to_json(sheet);
  console.log("Rows count:", data.length);
  if (data.length > 0) {
    console.log("First row data:", JSON.stringify(data[0], null, 2));
  } else {
    // Print sheet cells
    console.log("Keys in sheet:", Object.keys(sheet).filter(k => !k.startsWith('!')));
  }
} catch (e) {
  console.error("Failed to parse:", e);
}
