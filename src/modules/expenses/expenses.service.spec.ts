import { ExpensesService } from './expenses.service';

describe('ExpensesService', () => {
  const prisma = {
    serviceReport: {
      findMany: jest.fn(),
    },
    installationReport: {
      findMany: jest.fn(),
    },
  };

  const redis = {
    delByPrefix: jest.fn(),
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
      prisma as any,
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
});
