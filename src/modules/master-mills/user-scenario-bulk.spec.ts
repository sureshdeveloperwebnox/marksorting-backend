import * as ExcelJS from 'exceljs';
import { ExcelParserService } from '../../shared/services/excel-parser.service';
import { MasterMillsBulkService } from './master-mills-bulk.service';

describe('User Excel Template Bulk Upload Scenario', () => {
  it('correctly handles user screenshot Excel template with duplicate rows', async () => {
    // 1. Create workbook matching the user screenshot
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Template');

    // 11 headers as in the user screenshot
    worksheet.columns = [
      { header: 'Invoice No', key: 'invoice_no' },
      { header: 'Invoice Date', key: 'invoice_date' },
      { header: 'Ref No', key: 'ref_no' },
      { header: 'Mill Name', key: 'mill_name' },
      { header: 'Customer Name', key: 'customer_name' },
      { header: 'Place', key: 'place' },
      { header: 'State', key: 'state' },
      { header: 'Phone No', key: 'phone_no' },
      { header: 'Address', key: 'address' },
      { header: 'Frame No', key: 'frame_no' },
      { header: 'MC Model', key: 'mc_model' },
    ];

    // Row 2 (Valid)
    worksheet.addRow({
      invoice_no: 'INV-001',
      invoice_date: '01/01/2024',
      ref_no: 'REF-001',
      mill_name: 'ABC Mills',
      customer_name: 'John Doe',
      place: 'Chennai',
      state: 'Tamil Nadu',
      phone_no: '',
      address: '123, Main Street,',
      frame_no: 'FRM-001',
      mc_model: 'Model XYZ',
    });

    // Row 3 (Duplicate Ref & Frame No)
    worksheet.addRow({
      invoice_no: 'INV-001',
      invoice_date: '01/01/2024',
      ref_no: 'REF-001',
      mill_name: 'ABC Mills',
      customer_name: 'John Doe',
      place: 'Chennai',
      state: 'Tamil Nadu',
      phone_no: '',
      address: '123, Main Street,',
      frame_no: 'FRM-001',
      mc_model: 'Model XYZ',
    });

    const buffer = await workbook.xlsx.writeBuffer();

    const parser = new ExcelParserService();
    const rows = await parser.parseAndValidate(Buffer.from(buffer));

    expect(rows.length).toBe(2);
    expect(rows[0].invoice_no).toBe('INV-001');
    expect(rows[0].ref_no).toBe('REF-001');
    expect(rows[0].customer_name).toBe('John Doe');

    // Mock DB & Redis for MasterMillsBulkService
    const redisMock: any = {
      setJson: jest.fn().mockResolvedValue(undefined),
      getJson: jest.fn().mockResolvedValue(null),
    };
    const prismaMock: any = {
      masterMill: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    const masterMillsServiceMock: any = {
      quickRegister: jest.fn().mockResolvedValue({ _isUpdate: false }),
    };

    const bulkService = new MasterMillsBulkService(
      parser,
      masterMillsServiceMock,
      redisMock,
      prismaMock,
    );

    const preview = await bulkService.previewUpload({
      buffer: Buffer.from(buffer),
      fieldname: 'file',
      originalname: 'template (3).xlsx',
      encoding: '7bit',
      mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: buffer.byteLength,
    });

    expect(preview.totalRows).toBe(2);
    expect(preview.validRows).toBe(1);
    expect(preview.invalidRows).toBe(1);

    // Row 1 should be completely valid
    expect(preview.rows[0].isValid).toBe(true);
    expect(Object.keys(preview.rows[0].errors).length).toBe(0);

    // Row 2 should be flagged for duplicate Ref No & Frame No
    expect(preview.rows[1].isValid).toBe(false);
    expect(preview.rows[1].errors.ref_no).toBe('Duplicate Ref No in Excel sheet');
    expect(preview.rows[1].errors.frame_no).toBe('Duplicate Frame No in Excel sheet');
  });
});
