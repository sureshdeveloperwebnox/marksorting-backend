"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderInstallationReportPdfOptions = renderInstallationReportPdfOptions;
exports.renderInstallationReportTemplate = renderInstallationReportTemplate;
const maintenanceItems = [
    'Blow out the dust by using an air gun.',
    'Clean the entire machine by using a soft cloth.',
    'Frequently clean the dust that settles in the vibrator tray.',
    'Clean all the scattered materials that settle in the machine.',
    'Clean the sensor box glass with a separate soft cloth without scratching the glass.',
    'Frequently make sure that there is no oil or water spillage in the filter bowl of the sorter machine and compressor filter bowls, if there is any spillage immediately turn off the machine. Because it will entirely harm the machine performance and lead to the replacement of valves and all the pneumatic parts. You can run the machine only if the problem has been solved.',
];
const labelCell = (label, extraClass = '') => `<td class="label-cell ${extraClass}">${label}</td>`;
const valueCell = (value, extraClass = '') => `<td class="value-cell ${extraClass}">${value}</td>`;
const row = (label, value, extraValueClass = '') => `
  <tr>
    ${labelCell(label)}
    ${valueCell(value, extraValueClass)}
  </tr>
`;
const fullRow = (label, value, minHeight = 34) => `
  <tr>
    <td colspan="2" class="full-row" style="height: ${minHeight}px;">
      <div class="full-row-content">
        <span class="label">${label}</span>
        <span class="block-value">${value}</span>
      </div>
    </td>
  </tr>
`;
const documentHeader = (company, template, reportNumber) => {
    const logoSrc = template.imageSrc(company.logoUrl);
    const companyLines = [
        company.addressLine1,
        company.addressLine2,
        company.region,
    ].filter(Boolean);
    return `
    <div class="document-header">
      <div class="header-logo-wrap">
        ${logoSrc ? `<img class="header-logo" src="${logoSrc}" alt="Company logo" />` : ''}
      </div>
      <div class="header-company">
        <div class="header-company-name">${template.text(company.name, 'Company')}</div>
        <div class="header-partner">(${template.text(company.partnerDescription, '')})</div>
        <div class="header-address">${companyLines.map((line) => template.escape(line)).join('<br />')}</div>
        <div class="header-contact">${company.email ? `E-mail : ${template.escape(company.email)}` : ''}</div>
        <div class="header-contact">
          ${company.tollFree ? `Toll Free : ${template.escape(company.tollFree)}` : ''}
          ${company.cellNumbers ? ` / Cell : ${template.escape(company.cellNumbers)}` : ''}
        </div>
      </div>
      <div class="header-serial">SI.NO: ${template.text(reportNumber)}</div>
    </div>
  `;
};
const documentFooter = (company, template) => `
  <div style="width:100%; padding:0 10mm; font-family:Arial, Helvetica, sans-serif; color:#111827; font-size:10px;">
    <div style="border-top:1px solid #777; padding-top:7mm; text-align:center; font-weight:800; letter-spacing:0.3px;">
      ${company.gstNo ? `GSTIN : ${template.escape(company.gstNo)}` : '&nbsp;'}
    </div>
  </div>
`;
function renderInstallationReportPdfOptions(company, template) {
    return {
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate: documentFooter(company, template),
        margin: {
            top: '10mm',
            right: '10mm',
            bottom: '22mm',
            left: '10mm',
        },
    };
}
function renderInstallationReportTemplate(data, template) {
    const { report, company } = data;
    const technicians = report.technicians
        ?.map((entry) => entry.technician?.full_name)
        .filter(Boolean)
        .join(', ');
    const formatGroundEarthField = (val) => {
        if (!val)
            return '-';
        const mapping = {
            PRIMARY: 'Primary',
            SECONDARY: 'Secondary',
            REJECTION_1: 'Rejection 1',
            REJECTION_2: 'Rejection 2',
            SPLIT: 'Split',
        };
        return mapping[val] || val;
    };
    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page { size: A4; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: #111827;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11px;
      line-height: 1.25;
      background: #fff;
    }
    .print-frame {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    .print-frame > thead {
      display: table-header-group;
    }
    .print-frame > thead > tr > td,
    .print-frame > tbody > tr > td {
      border: 0;
      padding: 0;
      vertical-align: top;
    }
    .document-header {
      height: 38mm;
      display: grid;
      grid-template-columns: 45mm 1fr;
      column-gap: 8mm;
      row-gap: 1mm;
      align-items: start;
      background: #fff;
      padding-bottom: 6mm;
    }
    .header-logo-wrap {
      width: 45mm;
      height: 22mm;
    }
    .header-logo {
      display: block;
      width: 38mm;
      height: 18mm;
      object-fit: contain;
    }
    .header-company {
      text-align: right;
      font-weight: 700;
      line-height: 1.15;
      font-size: 9px;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.6mm;
    }
    .header-company-name {
      color: #00664d;
      font-size: 20px;
      font-weight: 800;
      line-height: 1;
      margin-bottom: 0.6mm;
    }
    .header-partner {
      color: #f05a00;
      font-size: 9px;
      line-height: 1.15;
    }
    .header-address,
    .header-contact {
      line-height: 1.18;
    }
    .header-serial {
      grid-column: 1 / -1;
      font-weight: 700;
      font-size: 11px;
      margin-top: 0;
    }
    .document {
      width: 100%;
      padding-top: 0;
    }
    table.report {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      break-inside: auto;
      page-break-inside: auto;
    }
    tr {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .report th,
    .report td {
      border: 1px solid #111;
      vertical-align: top;
      padding: 3.5px 6px;
      word-break: break-word;
      overflow-wrap: anywhere;
    }
    .report th {
      text-align: center;
      font-weight: 800;
      background: #fff;
    }
    .label {
      font-weight: 800;
      margin-right: 4px;
    }
    .label-cell {
      font-weight: 800;
      white-space: nowrap;
      width: 40%;
    }
    .value-cell {
      font-weight: 400;
      width: 60%;
    }
    .nowrap {
      white-space: nowrap;
      word-break: normal;
      overflow-wrap: normal;
    }
    .company-details-value {
      padding: 4px 6px !important;
    }
    .company-name {
      font-weight: 800;
      font-size: 11.5px;
      margin-bottom: 2px;
    }
    .company-sub {
      color: #374151;
      font-weight: 400;
      margin-bottom: 1.5px;
    }
    .full-row-content {
      display: grid;
      grid-template-columns: max-content 1fr;
      align-items: start;
      column-gap: 4mm;
    }
    .full-row-content .label {
      white-space: nowrap;
    }
    .block-value {
      white-space: pre-wrap;
      font-weight: 400;
      min-width: 0;
    }
    .notice {
      border: 1px solid #111;
      border-top: 0;
      padding: 7px 8px;
      font-size: 10px;
      font-weight: 800;
      text-align: center;
      text-transform: uppercase;
      color: #1e3a8a;
      background: #eff6ff;
      line-height: 1.35;
    }
    .maintenance-title {
      color: #d97706;
      text-decoration: underline;
      font-weight: 800;
      text-align: center;
      font-size: 11.5px;
      padding: 6px 0 !important;
    }
    .maintenance td {
      color: #f05a00;
      font-size: 10.5px;
      height: 9.5mm;
      vertical-align: middle;
    }
    .signature-cell {
      height: 28mm;
      position: relative;
    }
    .signature-top-spacer td,
    .signature-spacer td {
      height: 6mm;
      border: 0;
      padding: 0;
    }
    .signature-image {
      max-width: 52mm;
      max-height: 20mm;
      object-fit: contain;
      margin-top: 2.5mm;
      opacity: 0.85;
    }
    .second-section {
      margin-top: 0;
      page-break-before: always;
      break-before: page;
    }
  </style>
</head>
<body>
  <table class="print-frame">
    <thead>
      <tr><td>${documentHeader(company, template, report.report_number)}</td></tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <main class="document">
            <!-- PAGE 1: Installation Specs -->
            <table class="report">
              <colgroup>
                <col style="width: 40%;" />
                <col style="width: 60%;" />
              </colgroup>
              <tr><th colspan="2">INSTALLATION REPORT</th></tr>
              ${row('Service Engineer Name', template.text(technicians))}
              <tr>
                ${labelCell('Company Name')}
                <td class="value-cell company-details-value">
                  <div class="company-name">${template.text(report.mill?.name)}</div>
                  <div class="company-sub">${template.text(report.place)}</div>
                  <div class="company-sub">${template.text(report.mill_whatsapp_number)}</div>
                </td>
              </tr>
              ${row('Date', template.date(report.visit_date))}
              ${row('Time', template.time(report.visit_time))}
              ${row('Call Registered Date', template.date(report.call_registered_date))}
              ${row('Sl.No/Frame No', template.text(report.serial_or_frame_no))}
              ${row('Model', template.text(report.machine_model))}
              ${row('Authorized Person', template.text(report.authorized_person) + (report.authorized_person_phone ? ` (Contact: ${report.authorized_person_phone})` : ''))}
              ${row('Invoice Number', template.text(report.invoice_number))}
              ${row('Invoice Date', template.date(report.invoice_date))}
              ${row('Warranty Start Date', template.date(report.warranty_start_date))}
              ${row('Warranty End Date', template.date(report.warranty_end_date))}
              ${row('Commodity', template.text(report.commodity))}
              ${row('Contamination', template.text(report.contamination))}
              ${row('Output Capacity / hour', template.text(report.output_capacity_per_hour))}
              ${row('Rejection Ratio', template.text(report.rejection_ratio))}
              ${row('Purity', template.text(report.purity))}
              ${row('No.of Program Set', template.text(report.no_of_programs_set))}
              ${row('Air Conditioner Provided', template.yesNo(report.ac_provided))}
              ${row('Compressor Details', template.text(report.compressor_details))}
              ${row('Air Drier Details', template.text(report.air_drier_details))}
              ${row('Ground Earth Provided', template.yesNo(report.ground_earth_provided))}
              ${row('Running Channel Combination Type', formatGroundEarthField(report.ground_earth_field))}
              ${row('No.of Filters Installed', template.text(report.no_of_filters_installed))}
              ${row('Oil Filter Condition', template.text(report.oil_filter_condition))}
              ${row('Line Filter Condition', template.text(report.line_filter_condition))}
              ${row('Auto Drain Valve Working', template.yesNo(report.auto_drain_valve_working))}
            </table>

            <!-- PAGE 2: Remarks & Routine Maintenance -->
            <div class="second-section">
              <table class="report">
                ${fullRow('Service Engineer Remarks :', template.text(report.engineer_remarks), 28)}
              </table>
              <div class="notice">
                We are not responsible for any damage to the mark color sorter machine ejector valves and pneumatic parts due to oil or water particles that comes from the compressor and air drier
              </div>
              <table class="report maintenance">
                <colgroup>
                  <col style="width: 50%;" />
                  <col style="width: 50%;" />
                </colgroup>
                <tr><td colspan="2" class="maintenance-title">Routine Maintenance</td></tr>
                <tr>
                  <td>1. ${template.escape(maintenanceItems[0])}</td>
                  <td>2. ${template.escape(maintenanceItems[1])}</td>
                </tr>
                <tr>
                  <td>3. ${template.escape(maintenanceItems[2])}</td>
                  <td>4. ${template.escape(maintenanceItems[3])}</td>
                </tr>
                <tr>
                  <td colspan="2">5. ${template.escape(maintenanceItems[4])}</td>
                </tr>
                <tr>
                  <td colspan="2">6. ${template.escape(maintenanceItems[5])}</td>
                </tr>
              </table>
              <table class="report">
                <tr class="signature-top-spacer"><td colspan="2"></td></tr>
                ${fullRow('Customer Remarks :', template.text(report.customer_remarks), 26)}
                ${fullRow('Work Status Remarks :', template.text(report.status), 24)}
                <tr class="signature-spacer"><td colspan="2"></td></tr>
                <tr>
                  <td class="signature-cell" style="width: 50%;">
                    <span class="label">Customer Signature:</span><br />
                    ${template.imageSrc(report.customer_signature) ? `<img class="signature-image" src="${template.imageSrc(report.customer_signature)}" />` : ''}
                  </td>
                  <td class="signature-cell" style="width: 50%;">
                    <span class="label">Service Engineer Signature :</span><br />
                    ${template.imageSrc(report.engineer_signature) ? `<img class="signature-image" src="${template.imageSrc(report.engineer_signature)}" />` : ''}
                  </td>
                </tr>
              </table>
            </div>
          </main>
        </td>
      </tr>
    </tbody>
  </table>
</body>
</html>`;
}
//# sourceMappingURL=installation-report.template.js.map