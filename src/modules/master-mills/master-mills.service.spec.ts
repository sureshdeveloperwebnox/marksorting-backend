import { BadRequestException } from '@nestjs/common';
import { MasterMillsService } from './master-mills.service';
import { MasterMillsBulkService } from './master-mills-bulk.service';

describe('MasterMillsService & MasterMillsBulkService', () => {
  const redis = {
    getJson: jest.fn(),
    setJson: jest.fn(),
    delByPrefix: jest.fn(),
    del: jest.fn(),
    delByPrefixSync: jest.fn(),
    delByPrefixAsync: jest.fn(),
  };

  const prisma: any = {
    $transaction: jest.fn((cb) => cb(prisma)),
    customer: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    mill: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    masterMill: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const excelParser = {
    generateTemplate: jest.fn(),
    parseAndValidate: jest.fn(),
  };

  let masterMillsService: MasterMillsService;
  let bulkService: MasterMillsBulkService;

  beforeEach(() => {
    jest.clearAllMocks();
    redis.getJson.mockResolvedValue(null);
    redis.setJson.mockResolvedValue(undefined);
    redis.delByPrefix.mockResolvedValue(undefined);
    redis.del.mockResolvedValue(undefined);

    const mockCustomer = {
      id: 'cust-123',
      name: 'Ravi Kumar',
      phone: '9876543210',
      address: 'Chennai',
      email: 'ravi@gmail.com',
    };

    const mockMill = {
      id: 'mill-456',
      name: 'Golden Valley Mill',
      customer_id: 'cust-123',
      phone: '9876543210',
      address: 'Chennai',
      place: 'Chennai',
      ref_no: 'REF-001',
    };

    prisma.customer.findFirst.mockResolvedValue(mockCustomer);
    prisma.customer.update.mockResolvedValue(mockCustomer);
    prisma.customer.create.mockResolvedValue(mockCustomer);

    prisma.mill.findFirst.mockResolvedValue(mockMill);
    prisma.mill.update.mockResolvedValue(mockMill);
    prisma.mill.create.mockResolvedValue(mockMill);
    prisma.mill.findUnique.mockResolvedValue(mockMill);

    masterMillsService = new MasterMillsService(prisma as any, redis as any);
    bulkService = new MasterMillsBulkService(excelParser as any, masterMillsService, redis as any);
  });

  describe('quickRegister', () => {
    it('creates a new MasterMill with all DTO fields populated', async () => {
      const dto = {
        customer_name: 'Ravi Kumar',
        mill_name: 'Golden Valley Mill',
        ref_no: 'REF-001',
        frame_no: 'FRM-123',
        mc_model: 'Model XYZ',
        place: 'Chennai',
        state: 'Tamil Nadu',
        phone: '9876543210',
        type: 'Installation',
        invoice_no: 'INV-1001',
        invoice_date: '2024-01-15',
        installation_date: '2024-01-20',
        warranty_start_date: '2024-01-25',
        warranty_years: 2,
        warranty_months: 6,
        amc_starting_date: '2026-02-01',
        amc_period: 12,
        amc_amount: 5000,
        amc_particulars: 'Full warranty + AMC',
      };

      prisma.masterMill.findFirst.mockResolvedValue(null); // No existing record
      const createdRecord = {
        id: 'mm-789',
        invoice_no: 'INV-1001',
        ref_no: 'REF-001',
        mill_id: 'mill-456',
      };
      prisma.masterMill.create.mockResolvedValue(createdRecord);
      prisma.masterMill.findUnique.mockResolvedValue(createdRecord);

      const result = await masterMillsService.quickRegister(dto);

      expect(prisma.masterMill.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            invoice_no: 'INV-1001',
            invoice_date: new Date('2024-01-15'),
            installation_date: new Date('2024-01-20'),
            warranty_start_date: new Date('2024-01-25'),
            warranty_years: 2,
            warranty_months: 6,
            amc_starting_date: new Date('2026-02-01'),
            amc_period: 12,
            amc_amount: 5000,
            amc_particular: 'Full warranty + AMC',
            ref_no: 'REF-001',
            frame_no: 'FRM-123',
          }),
        }),
      );
      expect(result).toEqual(createdRecord);
    });

    it('updates an existing MasterMill when matching within the same mill (non-bulk path)', async () => {
      const dto = {
        customer_name: 'Ravi Kumar',
        mill_name: 'Golden Valley Mill',
        ref_no: 'REF-001',
        frame_no: 'FRM-123',
        place: 'Chennai',
        invoice_no: 'INV-NEW-99',
      };

      const existingRecord = {
        id: 'mm-789',
        invoice_no: 'INV-OLD-01',
        ref_no: 'REF-001',
        mill_id: 'mill-456',
      };
      prisma.masterMill.findFirst.mockResolvedValue(existingRecord); // Match found within same mill
      prisma.masterMill.update.mockResolvedValue({ ...existingRecord, invoice_no: 'INV-NEW-99' });
      prisma.masterMill.findUnique.mockResolvedValue({ ...existingRecord, invoice_no: 'INV-NEW-99' });

      await masterMillsService.quickRegister(dto);

      expect(prisma.masterMill.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'mm-789' },
          data: expect.objectContaining({
            invoice_no: 'INV-NEW-99',
          }),
        }),
      );
    });

    it('always creates a new MasterMill during bulk upload (skipDuplicateCheck=true)', async () => {
      const dto = {
        customer_name: 'Ravi Kumar',
        mill_name: 'Golden Valley Mill',
        ref_no: 'REF-001',
        frame_no: 'FRM-123',
        place: 'Chennai',
        invoice_no: 'INV-BULK-01',
      };

      const existingRecord = {
        id: 'mm-789',
        invoice_no: 'INV-OLD-01',
        ref_no: 'REF-001',
        mill_id: 'mill-456',
      };
      const newRecord = { id: 'mm-999', invoice_no: 'INV-BULK-01', mill_id: 'mill-456' };

      // findFirst is mocked with an existing record but it should NOT be called during bulk
      prisma.masterMill.findFirst.mockResolvedValue(existingRecord);
      prisma.masterMill.create.mockResolvedValue(newRecord);
      prisma.masterMill.findUnique.mockResolvedValue(newRecord);

      await masterMillsService.quickRegister(dto, { skipDuplicateCheck: true });

      // create should be called, not update
      expect(prisma.masterMill.create).toHaveBeenCalled();
      expect(prisma.masterMill.update).not.toHaveBeenCalled();
    });
  });

  describe('parseExcelDate', () => {
    it('parses DD/MM/YYYY date strings into YYYY-MM-DD', () => {
      const parsed = (bulkService as any).parseExcelDate('25/06/2026');
      expect(parsed).toEqual('2026-06-25');
    });

    it('parses standard ISO date strings', () => {
      const parsed = (bulkService as any).parseExcelDate('2026-06-25T12:00:00Z');
      expect(parsed).toEqual('2026-06-25');
    });

    it('returns undefined for invalid or empty dates', () => {
      expect((bulkService as any).parseExcelDate('')).toBeUndefined();
      expect((bulkService as any).parseExcelDate(null)).toBeUndefined();
    });
  });
});
