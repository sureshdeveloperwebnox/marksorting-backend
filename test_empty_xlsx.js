const XLSX = require('xlsx');
const fs = require('fs');

const exportData = [];
const ws = XLSX.utils.json_to_sheet(exportData);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Activity Logs');
const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
console.log("Empty sheet size:", buffer.length);
fs.writeFileSync('test_empty_output.xlsx', buffer);
