import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TicketsService } from './tickets.service';

describe('TicketsService', () => {
  const redis = {
    getJson: jest.fn(),
    setJson: jest.fn(),
    delByPrefix: jest.fn(),
    del: jest.fn(),
  };

  const prisma = {
    supportTicket: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    technician: {
      findFirst: jest.fn(),
    },
    customer: {
      findFirst: jest.fn(),
    },
    mill: {
      findFirst: jest.fn(),
    },
  };

  let service: TicketsService;

  beforeEach(() => {
    jest.clearAllMocks();
    redis.getJson.mockResolvedValue(null);
    redis.setJson.mockResolvedValue(undefined);
    redis.delByPrefix.mockResolvedValue(undefined);
    redis.del.mockResolvedValue(undefined);
    prisma.technician.findFirst.mockResolvedValue({ id: 'engineer-id' });
    prisma.customer.findFirst.mockResolvedValue({ id: 'customer-id' });
    prisma.mill.findFirst.mockResolvedValue({
      id: 'mill-id',
      customer_id: 'customer-id',
    });
    service = new TicketsService(prisma as any, redis as any, { emit: jest.fn() } as any);
  });

  it('creates a ticket with service engineer, customer, and mill relations', async () => {
    const created = {
      id: 'ticket-id',
      service_engineer_id: 'engineer-id',
      customer_id: 'customer-id',
      mill_id: 'mill-id',
    };
    prisma.supportTicket.create.mockResolvedValue(created);

    await expect(
      service.create({
        service_engineer_id: 'engineer-id',
        customer_id: 'customer-id',
        mill_id: 'mill-id',
        subject: 'Printer issue',
        description: 'Printer is not responding',
        priority: 'MEDIUM',
      }),
    ).resolves.toEqual(created);

    expect(prisma.supportTicket.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          service_engineer_id: 'engineer-id',
          customer_id: 'customer-id',
          mill_id: 'mill-id',
        }),
      }),
    );
  });

  it('rejects a mill that does not belong to the selected customer', async () => {
    prisma.mill.findFirst.mockResolvedValue({
      id: 'mill-id',
      customer_id: 'different-customer-id',
    });

    await expect(
      service.create({
        service_engineer_id: 'engineer-id',
        customer_id: 'customer-id',
        mill_id: 'mill-id',
        subject: 'Printer issue',
        description: 'Printer is not responding',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects an unknown service engineer', async () => {
    prisma.technician.findFirst.mockResolvedValue(null);

    await expect(
      service.create({
        service_engineer_id: 'missing-engineer-id',
        customer_id: 'customer-id',
        subject: 'Printer issue',
        description: 'Printer is not responding',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('validates the effective customer and mill on update', async () => {
    prisma.supportTicket.findUnique.mockResolvedValue({
      id: 'ticket-id',
      service_engineer_id: 'engineer-id',
      customer_id: 'customer-id',
      mill_id: 'mill-id',
    });
    prisma.mill.findFirst.mockResolvedValue({
      id: 'mill-id',
      customer_id: 'customer-id',
    });
    prisma.supportTicket.update.mockResolvedValue({
      id: 'ticket-id',
      customer_id: 'customer-id',
    });

    await expect(
      service.update('ticket-id', { priority: 'HIGH' }),
    ).resolves.toEqual({
      id: 'ticket-id',
      customer_id: 'customer-id',
    });

    expect(prisma.mill.findFirst).toHaveBeenCalledWith({
      where: { id: 'mill-id', deleted_at: null },
    });
  });
});
