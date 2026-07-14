import { DocumentTemplateService } from './document-template.service';
import type { PDFOptions } from 'puppeteer';

export interface CompanyPdfSettings {
  logoUrl?: string;
  name?: string;
  partnerDescription?: string;
  addressLine1?: string;
  addressLine2?: string;
  region?: string;
  email?: string;
  tollFree?: string;
  cellNumbers?: string;
  gstNo?: string;
}

export interface ServiceReportPdfData {
  report: any;
  company: CompanyPdfSettings;
}

const maintenanceItems = [
  'Blow out the dust by using an air gun.',
  'Clean the entire machine by using a soft cloth.',
  'Frequently clean the dust that settles in the vibrator tray.',
  'Clean all the scattered materials that settle in the machine.',
  'Clean the sensor box glass with a separate soft cloth without scratching the glass.',
  'Frequently make sure that there is no oil or water spillage in the filter bowl of the sorter machine and compressor filter bowls, if there is any spillage immediately turn off the machine. Because it will entirely harm the machine performance and lead to the replacement of valves and all the pneumatic parts. You can run the machine only if the problem has been solved.',
];

const labelCell = (label: string, extraClass = '') =>
  `<td class="label-cell ${extraClass}">${label}</td>`;
const valueCell = (value: string, extraClass = '') =>
  `<td class="value-cell ${extraClass}">${value}</td>`;

const pairRow = (
  leftLabel: string,
  leftValue: string,
  rightLabel: string,
  rightValue: string,
) => `
  <tr>
    ${labelCell(leftLabel)}
    ${valueCell(leftValue)}
    ${labelCell(rightLabel)}
    ${valueCell(rightValue, 'nowrap')}
  </tr>
`;

const twoColumnRow = (label: string, value: string) => `
  <tr>
    <td colspan="2" class="label-cell">${label}</td>
    <td colspan="2" class="value-cell">${value}</td>
  </tr>
`;

const fullRow = (label: string, value: string, minHeight = 34) => `
  <tr>
    <td colspan="4" class="full-row" style="height: ${minHeight}px;">
      <div class="full-row-content">
        <span class="label">${label}</span>
        <span class="block-value">${value}</span>
      </div>
    </td>
  </tr>
`;

const documentHeader = (
  company: CompanyPdfSettings,
  template: DocumentTemplateService,
  reportNumber: unknown,
): string => {
  const logoSrc = template.imageSrc(company.logoUrl);
  const companyLines = [
    company.addressLine1,
    company.addressLine2,
    company.region,
  ].filter(Boolean);

  return `
    <table style="width: 100%; border-collapse: collapse; border: 0; margin-bottom: 4mm; background: #fff;">
      <tr>
        <td style="width: 50mm; vertical-align: top; border: 0; padding: 0;">
          ${logoSrc ? `<img src="${logoSrc}" alt="Company logo" style="display: block; width: 45mm; height: 18mm; object-fit: contain;" />` : ''}
        </td>
        <td style="vertical-align: top; text-align: right; border: 0; padding: 0; font-family: Arial, sans-serif;">
          <div style="color: #00664d; font-size: 22px; font-weight: 800; line-height: 1.1; margin-bottom: 2px;">${template.text(company.name, 'Company')}</div>
          <div style="color: #f05a00; font-size: 11px; font-weight: 700; line-height: 1.2; margin-bottom: 3px;">(${template.text(company.partnerDescription, '')})</div>
          <div style="font-size: 11px; color: #111827; line-height: 1.3;">
            ${companyLines.map((line) => template.escape(line)).join('<br />')}
            ${company.email ? `<br />E-mail : ${template.escape(company.email)}` : ''}
            ${company.tollFree || company.cellNumbers ? `<br />${company.tollFree ? `Toll Free : ${template.escape(company.tollFree)}` : ''}${company.cellNumbers ? ` / Cell : ${template.escape(company.cellNumbers)}` : ''}` : ''}
          </div>
        </td>
      </tr>
      <tr>
        <td colspan="2" style="border: 0; padding: 4px 0 0; font-weight: 700; font-size: 13px; text-align: left;">
          SI.NO: ${template.text(reportNumber)}
        </td>
      </tr>
    </table>
  `;
};

const documentFooter = (
  company: CompanyPdfSettings,
  template: DocumentTemplateService,
): string => `
  <div style="width:100%; padding:0 10mm; font-family:Arial, Helvetica, sans-serif; color:#111827; font-size:15px; font-weight:900;">
    <div style="border-top:1px solid #777; padding-top:5mm; text-align:center; letter-spacing:0.5px;">
      ${company.gstNo ? `GSTIN : ${template.escape(company.gstNo)}` : '&nbsp;'}
    </div>
  </div>
`;

export function renderServiceReportPdfOptions(
  company: CompanyPdfSettings,
  template: DocumentTemplateService,
): PDFOptions {
  return {
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: documentFooter(company, template),
    margin: {
      top: '10mm',
      right: '10mm',
      bottom: '18mm',
      left: '10mm',
    },
    format: 'A4',
    printBackground: true,
  };
}

export function renderServiceReportTemplate(
  data: ServiceReportPdfData,
  template: DocumentTemplateService,
): string {
  const { report, company } = data;
  const technicians = report.technicians
    ?.map((entry: any) => entry.technician?.full_name)
    .filter(Boolean)
    .join(', ');
  const category = report.serviceCategory?.name || 'Service Report';

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page { 
      size: A4;
      margin: 10mm 10mm 18mm 10mm;
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      color: #111827;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12.5px;
      line-height: 1.3;
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
      width: 100%;
      display: grid;
      grid-template-columns: 45mm 1fr;
      column-gap: 6mm;
      row-gap: 1.5mm;
      align-items: start;
      background: #fff;
      padding-bottom: 4mm;
    }
    .header-logo-wrap {
      width: 45mm;
      height: 18mm;
    }
    .header-logo {
      display: block;
      width: 42mm;
      height: 16mm;
      object-fit: contain;
      margin-top: 2px;
    }
    .header-company {
      text-align: right;
      font-weight: 700;
      line-height: 1.15;
      font-size: 11.5px;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.6mm;
    }
    .header-company-name {
      color: #00664d;
      font-size: 22px;
      font-weight: 800;
      line-height: 1;
      margin-bottom: 0.6mm;
    }
    .header-partner {
      color: #f05a00;
      font-size: 11px;
      line-height: 1.15;
    }
    .header-address,
    .header-contact {
      line-height: 1.2;
    }
    .header-serial {
      grid-column: 1 / -1;
      font-weight: 700;
      font-size: 13px;
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
      margin: 0;
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
      vertical-align: middle;
      padding: 3px 5px;
      word-break: break-word;
      overflow-wrap: anywhere;
    }
    .report th {
      text-align: center;
      font-weight: 800;
      font-size: 14px;
      background: #fff;
      padding: 4px 5px;
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
      padding: 6px 7px;
      font-size: 13.5px;
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
      height: 8.5mm;
      vertical-align: middle;
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
        ${fullRow('Authorized Person :', template.text(report.authorized_person) + (report.authorized_person_phone ? ` (Contact: ${report.authorized_person_phone})` : ''), 20)}
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
        ${fullRow('Work Status :', template.status(report.status), 24)}
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
