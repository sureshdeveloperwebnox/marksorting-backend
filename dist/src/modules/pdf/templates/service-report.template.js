"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderServiceReportPdfOptions = renderServiceReportPdfOptions;
exports.renderServiceReportTemplate = renderServiceReportTemplate;
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
const pairRow = (leftLabel, leftValue, rightLabel, rightValue) => `
  <tr>
    ${labelCell(leftLabel)}
    ${valueCell(leftValue)}
    ${labelCell(rightLabel)}
    ${valueCell(rightValue, 'nowrap')}
  </tr>
`;
const twoColumnRow = (label, value) => `
  <tr>
    <td colspan="2" class="label-cell">${label}</td>
    <td colspan="2" class="value-cell">${value}</td>
  </tr>
`;
const fullRow = (label, value, minHeight = 34) => `
  <tr>
    <td colspan="4" class="full-row" style="height: ${minHeight}px;">
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
function renderServiceReportPdfOptions(company, template) {
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
function renderServiceReportTemplate(data, template) {
    const { report, company } = data;
    const technicians = report.technicians
        ?.map((entry) => entry.technician?.full_name)
        .filter(Boolean)
        .join(', ');
    const category = report.serviceCategory?.name || 'Service Report';
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
      line-height: 1.2;
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
    .serial {
      font-weight: 700;
      margin: 0 0 5mm;
    }
    table.report {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      break-inside: auto;
      page-break-inside: auto;
    }
    table.report + table.report,
    .notice + table.report {
      margin-top: 0;
    }
    tr {
      break-inside: auto;
      page-break-inside: auto;
    }
    .report th,
    .report td {
      border: 1px solid #111;
      vertical-align: top;
      padding: 2px 4px;
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
    }
    .value-cell {
      font-weight: 400;
    }
    .nowrap {
      white-space: nowrap;
      word-break: normal;
      overflow-wrap: normal;
    }
    .value {
      font-weight: 400;
    }
    .company-details-cell {
      height: 31mm;
      position: relative;
    }
    .company-field-label {
      position: absolute;
      top: 2px;
      left: 4px;
      font-weight: 800;
    }
    .company-field-values {
      height: 100%;
      padding: 6mm 8mm 2mm;
      text-align: center;
      font-weight: 400;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
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
    .section-title {
      text-align: center;
      font-weight: 800;
      background: #fff;
    }
    .notice {
      border: 1px solid #111;
      border-top: 0;
      padding: 5px 6px;
      font-size: 11px;
      text-transform: uppercase;
    }
    .maintenance-title {
      color: #d97706;
      text-decoration: underline;
      font-weight: 800;
      text-align: center;
    }
    .maintenance td {
      color: #f05a00;
      font-size: 11px;
      height: 9mm;
    }
    .signature-cell {
      height: 28mm;
      position: relative;
    }
    .signature-top-spacer td,
    .signature-spacer td {
      height: 8mm;
      border: 0;
      padding: 0;
    }
    .signature-image {
      max-width: 52mm;
      max-height: 22mm;
      object-fit: contain;
      margin-top: 4mm;
      opacity: 0.75;
    }
    .second-section {
      margin-top: 0;
    }
    .avoid-break { break-inside: avoid; page-break-inside: avoid; }
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
      <table class="report">
        <colgroup>
          <col style="width: 28%;" />
          <col style="width: 22%;" />
          <col style="width: 30%;" />
          <col style="width: 20%;" />
        </colgroup>
        <tr><th colspan="4">SERVICE REPORT</th></tr>
        <tr><th colspan="4">${template.text(category)}</th></tr>
        ${pairRow('Service Engineer Name :', template.text(technicians), 'Date :', template.date(report.visit_date))}
        <tr>
          <td rowspan="6" colspan="2" class="company-details-cell">
            <span class="company-field-label">Company Name :</span>
            <div class="company-field-values">
              ${template.text(report.mill?.name)}<br />
              ${template.text(report.place)}<br />
              ${template.text(report.mill_whatsapp_number)}
            </div>
          </td>
          ${labelCell('Time :')}
          ${valueCell(template.time(report.visit_time), 'nowrap')}
        </tr>
        <tr>${labelCell('Call Registered Date :')}${valueCell(template.date(report.call_registered_date), 'nowrap')}</tr>
        <tr>${labelCell('Model :')}${valueCell(template.text(report.machine_model))}</tr>
        <tr>${labelCell('Mfg Date :')}${valueCell(template.date(report.machine_mfg_date), 'nowrap')}</tr>
        <tr>${labelCell('Installation Date :')}${valueCell(template.date(report.machine_installation_date), 'nowrap')}</tr>
        <tr>${labelCell('Sl.No/Frame No :')}${valueCell(template.text(report.serial_or_frame_no))}</tr>
        ${fullRow('Authorized Person :', template.text(report.authorized_person), 20)}
        ${fullRow('Previous Visited Engineer Name :', template.text(report.previous_visit_engineer), 20)}
        ${fullRow('Nature Of Complaint :', template.text(report.nature_of_complaint), 28)}
        ${fullRow('Problem Observed :', template.text(report.problem_observed), 28)}
        ${fullRow('Action taken to rectify the problem :', template.text(report.action_taken), 28)}
        <tr><td colspan="4" class="section-title">Machine Performance</td></tr>
        ${twoColumnRow('Commodity', template.text(report.commodity))}
        ${twoColumnRow('Contamination', template.text(report.contamination))}
        ${twoColumnRow('Output capacity / hour', template.text(report.output_capacity_per_hour))}
        ${twoColumnRow('Rejection Ratio', template.text(report.rejection_ratio))}
        ${twoColumnRow('Purity', template.text(report.purity))}
      </table>

      <div class="second-section">
      <table class="report">
        <colgroup>
          <col style="width: 31%;" />
          <col style="width: 18%;" />
          <col style="width: 32%;" />
          <col style="width: 19%;" />
        </colgroup>
        ${pairRow('No. Of Program Set', template.text(report.no_of_programs_set), 'Air Conditioner Provided', template.yesNo(report.ac_provided))}
        ${pairRow('Compressor Details', template.text(report.compressor_details), 'Air Drier Details', template.text(report.air_drier_details))}
        ${pairRow('Line Filter Condition', template.text(report.line_filter_condition), 'Machine Filter Condition', template.text(report.machine_filter_condition))}
        <tr>
          ${labelCell('')}
          ${valueCell('')}
          ${labelCell('Auto Drain Valve Working')}
          ${valueCell(template.yesNo(report.auto_drain_valve_working), 'nowrap')}
        </tr>
        ${fullRow('Service Engineer Remarks :', template.text(report.engineer_remarks), 28)}
      </table>
      <div class="notice">
        We are not responsible for any damage to the mark color sorter machine ejector valves and pneumatic parts due to oil or water particles that comes from the compressor and air drier
      </div>
      <table class="report maintenance">
        <tr><td colspan="2" class="maintenance-title">Routine Maintenance</td></tr>
        <tr><td>1. ${template.escape(maintenanceItems[0])}</td><td>2. ${template.escape(maintenanceItems[1])}</td></tr>
        <tr><td>3. ${template.escape(maintenanceItems[2])}</td><td>4. ${template.escape(maintenanceItems[3])}</td></tr>
        <tr><td colspan="2">5. ${template.escape(maintenanceItems[4])}</td></tr>
        <tr><td colspan="2">6. ${template.escape(maintenanceItems[5])}</td></tr>
      </table>
      <table class="report">
        <tr class="signature-top-spacer"><td colspan="4"></td></tr>
        ${fullRow('Customer Remarks :', template.text(report.customer_remarks), 26)}
        ${fullRow('Work Status Remarks :', template.text(report.status), 24)}
        <tr class="signature-spacer"><td colspan="4"></td></tr>
        <tr>
          <td colspan="2" class="signature-cell">
            <span class="label">Customer Signature:</span><br />
            ${template.imageSrc(report.customer_signature) ? `<img class="signature-image" src="${template.imageSrc(report.customer_signature)}" />` : ''}
          </td>
          <td colspan="2" class="signature-cell">
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
//# sourceMappingURL=service-report.template.js.map