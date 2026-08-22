import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';

const TEMPLATE_HEADERS = [
  'Invoice No',
  'Invoice Date',
  'Ref No',
  'Mill Name',
  'Customer Name',
  'Place',
  'State',
  'Phone No',
  'Address',
  'Frame No',
  'MC Model',
  'MFG Date',
  'Installation Date',
  'Warranty Start Date',
  'Warranty Period (Months)',
  'AMC Starting Date',
  'AMC Closing Date',
  'AMC Period (Months)',
  'AMC Amount',
  'AMC Particulars',
];

const MILL_NAMES = [
  'Sri Krishna Cotton Mills', 'Annapurna Rice Mills', 'Lakshmi Modern Flour Mill',
  'Deccan Agro Industries', 'Premier Textile Processors', 'Kaveri Dal & Pulse Mill',
  'Siddhivinayak Grain Processing', 'Narmada Solvent Extractions', 'Golden Harvest Rice Mill',
  'Balaji Yarn & Fabrics', 'Thirumala Foods & Agro', 'Shree Ram Flour Mills',
  'Ganga Yamuna Agro Foods', 'Mahalaxmi Roller Flour Mill', 'Shakti Seeds & Oil Mill',
  'Padmavathi Spices & Grain Processing', 'Venkateshwara Cotton Industries', 'Chola Rice Tech',
  'Sundaram Textiles Ltd', 'Kisan Samriddhi Agro Mills'
];

const CUSTOMER_NAMES = [
  'Rajesh Kumar', 'Venkatesh Iyer', 'Ramesh Patel', 'Amit Shah',
  'Gurpreet Singh', 'Ananya Sharma', 'Mohammed Farooq', 'Suresh Reddy',
  'Dinesh Chandran', 'Prakash Murugan', 'Harish Nair', 'Manoj Agarwal',
  'Vijayaraghavan K', 'Deepak Verma', 'Karthik Subburaj', 'Sanjay Joshi',
  'Sunil Choudhary', 'Arun Swaminathan', 'Manish Gupta', 'Ravichandran P'
];

const LOCATIONS = [
  { place: 'Coimbatore', state: 'Tamil Nadu' },
  { place: 'Tirupur', state: 'Tamil Nadu' },
  { place: 'Madurai', state: 'Tamil Nadu' },
  { place: 'Erode', state: 'Tamil Nadu' },
  { place: 'Salem', state: 'Tamil Nadu' },
  { place: 'Bengaluru', state: 'Karnataka' },
  { place: 'Mysuru', state: 'Karnataka' },
  { place: 'Hubli', state: 'Karnataka' },
  { place: 'Hyderabad', state: 'Telangana' },
  { place: 'Guntur', state: 'Andhra Pradesh' },
  { place: 'Vijayawada', state: 'Andhra Pradesh' },
  { place: 'Ahmedabad', state: 'Gujarat' },
  { place: 'Surat', state: 'Gujarat' },
  { place: 'Rajkot', state: 'Gujarat' },
  { place: 'Pune', state: 'Maharashtra' },
  { place: 'Nagpur', state: 'Maharashtra' },
  { place: 'Indore', state: 'Madhya Pradesh' },
  { place: 'Jaipur', state: 'Rajasthan' },
  { place: 'Ludhiana', state: 'Punjab' },
  { place: 'Kolkata', state: 'West Bengal' },
];

const MC_MODELS = [
  'MarkSort AI-Pro 4Ch',
  'MarkSort Color Vision 5',
  'MarkSort Ultra 600',
  'MarkSort Trichromatic 300',
  'MarkSort Belt-Sorter X2',
  'MarkSort MicroScan 8Ch',
  'MarkSort HD RGB 400',
  'MarkSort InGaAs Multi-Scan'
];

async function generate100RowsExcel() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Master Mills Bulk');

  worksheet.columns = TEMPLATE_HEADERS.map((header) => ({
    header,
    key: header,
    width: Math.max(header.length + 5, 18),
  }));

  // Style Header Row
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' }, // Deep Blue Header
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });
  headerRow.height = 28;

  for (let i = 1; i <= 100; i++) {
    const millName = MILL_NAMES[(i - 1) % MILL_NAMES.length];
    // Every 10th row test optional customer_name empty
    const customerName = (i % 10 === 0) ? '' : CUSTOMER_NAMES[(i - 1) % CUSTOMER_NAMES.length];
    const loc = LOCATIONS[(i - 1) % LOCATIONS.length];
    const mcModel = MC_MODELS[(i - 1) % MC_MODELS.length];
    const phoneNo = `98${String(40000000 + i * 371).padStart(8, '0').slice(0, 8)}`;
    const address = `Plot No. ${i * 7}, Industrial Estate, ${loc.place} - ${600000 + (i % 999)}`;
    const invoiceNo = `INV-2026-${String(i).padStart(4, '0')}`;
    const refNo = `MS-REF-${1000 + i}`;
    const frameNo = `FRM-2026-${String(i).padStart(4, '0')}`;

    // Varying Warranty / AMC Profiles across 100 rows
    let invDate = '15/01/2026';
    let mfgDate = '10/01/2026';
    let instDate = '20/01/2026';
    let warStartDate = '20/01/2026';
    let warMonths = '12';
    let amcStartDate = '';
    let amcCloseDate = '';
    let amcPeriod = '';
    let amcAmount = '';
    let amcParticulars = '';

    if (i <= 40) {
      // 1. Under Warranty (Active Warranty)
      const day = String((i % 28) + 1).padStart(2, '0');
      const month = String((i % 6) + 1).padStart(2, '0');
      invDate = `${day}/${month}/2026`;
      mfgDate = `01/${month}/2026`;
      instDate = `${day}/${month}/2026`;
      warStartDate = `${day}/${month}/2026`;
      warMonths = (i % 2 === 0) ? '24' : '12';
    } else if (i <= 75) {
      // 2. Under AMC (Warranty Expired in 2024, Active AMC in 2026)
      invDate = '10/02/2024';
      mfgDate = '01/02/2024';
      instDate = '15/02/2024';
      warStartDate = '15/02/2024';
      warMonths = '12';
      amcStartDate = '01/01/2026';
      amcCloseDate = '31/12/2026';
      amcPeriod = '12';
      amcAmount = String(25000 + (i % 10) * 5000);
      amcParticulars = (i % 2 === 0) ? 'Comprehensive Annual Maintenance' : 'Standard Service AMC';
    } else {
      // 3. Non Warranty / Post-Warranty (Historical installed 2022)
      invDate = '05/06/2022';
      mfgDate = '20/05/2022';
      instDate = '10/06/2022';
      warStartDate = '10/06/2022';
      warMonths = '12';
      amcStartDate = '';
      amcCloseDate = '';
      amcPeriod = '';
      amcAmount = '';
      amcParticulars = 'Expired - No Active AMC';
    }

    const row = worksheet.addRow([
      invoiceNo,
      invDate,
      refNo,
      millName,
      customerName,
      loc.place,
      loc.state,
      phoneNo,
      address,
      frameNo,
      mcModel,
      mfgDate,
      instDate,
      warStartDate,
      warMonths,
      amcStartDate,
      amcCloseDate,
      amcPeriod,
      amcAmount,
      amcParticulars,
    ]);

    // Zebra row styling
    if (i % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' },
        };
      });
    }
  }

  const outputPath = path.resolve('d:/Office/marksorting/master_mills_bulk_upload_100_rows.xlsx');
  await workbook.xlsx.writeFile(outputPath);
  console.log(`Successfully generated 100 rows Excel file at: ${outputPath}`);
}

generate100RowsExcel().catch(console.error);
