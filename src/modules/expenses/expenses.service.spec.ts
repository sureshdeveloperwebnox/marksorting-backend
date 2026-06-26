import { ExpensesService } from './expenses.service';

describe('ExpensesService', () => {
  const prisma: any = {
    serviceReport: {
      findMany: jest.fn(),
    },
    installationReport: {
      findMany: jest.fn(),
    },
  };

  const redis = {
    delByPrefix: jest.fn(),
    getJson: jest.fn(),
    setJson: jest.fn(),
  };

  const s3Service = {
    getFileUrl: jest.fn((key: string) => `https://files.example/${key}`),
  };

  let service: ExpensesService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.serviceReport.findMany.mockResolvedValue([]);
    prisma.installationReport.findMany.mockResolvedValue([]);

    service = new ExpensesService(
      prisma,
      redis as any,
      { emit: jest.fn() } as any,
      s3Service as any,
    );
  });

  it('checks only reports without active linked expenses for mobile dropdown eligibility', async () => {
    await service.checkEligibility({
      userId: 'engineer-id',
      role: 'Service Engineer',
    });

    expect(prisma.serviceReport.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [{ expense_id: null }],
          expenses: {
            none: {
              deleted_at: null,
            },
          },
        }),
      }),
    );
    expect(prisma.installationReport.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [{ expense_id: null }],
          expenses: {
            none: {
              deleted_at: null,
            },
          },
        }),
      }),
    );
  });

  it('keeps the current linked report selectable when editing an expense', async () => {
    await service.checkEligibility(
      {
        userId: 'engineer-id',
        role: 'Service Engineer',
      },
      undefined,
      'expense-id',
    );

    expect(prisma.serviceReport.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [{ expense_id: null }, { expense_id: 'expense-id' }],
          expenses: {
            none: {
              deleted_at: null,
              NOT: { id: 'expense-id' },
            },
          },
        }),
      }),
    );
  });

  describe('create and update with OTHERS type', () => {
    beforeEach(() => {
      redis.getJson = jest.fn().mockResolvedValue(null);
      redis.setJson = jest.fn().mockResolvedValue(undefined);
      prisma['expenseCategory'] = {
        findFirst: jest.fn().mockResolvedValue({ id: 'cat-id', name: 'Food' }),
      };
      prisma['technician'] = {
        count: jest.fn().mockResolvedValue(1),
      };
      prisma['expense'] = {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockResolvedValue({
          id: 'exp-id',
          expense_number: 'EXP-20260624-1',
          expense_images: [],
        }),
        findFirst: jest.fn().mockResolvedValue({
          id: 'exp-id',
          expense_number: 'EXP-20260624-1',
          expense_images: [],
          technicians: [],
        }),
        update: jest.fn().mockResolvedValue({
          id: 'exp-id',
          expense_number: 'EXP-20260624-1',
          expense_images: [],
        }),
      };
      prisma['expenseTechnician'] = {
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      };
      prisma['expenseItem'] = {
        create: jest.fn().mockResolvedValue({}),
        findFirst: jest.fn().mockResolvedValue({ id: 'item-id' }),
        update: jest.fn().mockResolvedValue({}),
      };
      prisma['$transaction'] = jest.fn((cb) => cb(prisma));
    });

    it('allows creating OTHERS type expense without reports', async () => {
      const dto = {
        expense_type: 'OTHERS',
        visit_date: '2026-06-24',
        expense_category_id: 'cat-id',
        amount: 500,
      };

      const result = await service.create(dto, {
        userId: 'tech-id',
        role: 'Service Engineer',
      });

      expect(result).toBeDefined();
      expect(prisma.expense.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            expense_type: 'OTHERS',
            service_report_id: null,
            installation_report_id: null,
          }),
        }),
      );
    });

    it('throws BadRequestException if OTHERS type expense is linked to a report during creation', async () => {
      const dto = {
        expense_type: 'OTHERS',
        visit_date: '2026-06-24',
        expense_category_id: 'cat-id',
        amount: 500,
        service_report_id: 'report-id',
      };

      await expect(
        service.create(dto, { userId: 'tech-id', role: 'Service Engineer' }),
      ).rejects.toThrow(
        'An expense of type OTHERS cannot be linked to a service report or installation report',
      );
    });

    it('allows updating OTHERS type expense without reports', async () => {
      // Mock findById (which calls findFirst)
      prisma.expense.findFirst.mockResolvedValueOnce({
        id: 'exp-id',
        expense_type: 'OTHERS',
        visit_date: new Date('2026-06-24'),
        service_report_id: null,
        installation_report_id: null,
        technicians: [{ technician_id: 'tech-id' }],
      });

      const dto = {
        expense_type: 'OTHERS',
        amount: 600,
      };

      const result = await service.update('exp-id', dto, {
        userId: 'tech-id',
        role: 'Service Engineer',
      });

      expect(result).toBeDefined();
      expect(prisma.expense.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'exp-id' },
          data: expect.objectContaining({
            expense_type: 'OTHERS',
            service_report_id: null,
            installation_report_id: null,
          }),
        }),
      );
    });

    it('throws BadRequestException if updating OTHERS type expense to link to a report', async () => {
      prisma.expense.findFirst.mockResolvedValueOnce({
        id: 'exp-id',
        expense_type: 'OTHERS',
        visit_date: new Date('2026-06-24'),
        service_report_id: null,
        installation_report_id: null,
        technicians: [{ technician_id: 'tech-id' }],
      });

      const dto = {
        service_report_id: 'report-id',
      };

      await expect(
        service.update('exp-id', dto, {
          userId: 'tech-id',
          role: 'Service Engineer',
        }),
      ).rejects.toThrow(
        'An expense of type OTHERS cannot be linked to a service report or installation report',
      );
    });
  });
});
