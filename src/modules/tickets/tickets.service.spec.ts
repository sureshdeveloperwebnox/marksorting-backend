import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
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
      findMany: jest.fn(),
      count: jest.fn(),
    },
    ticketTimeline: {
      create: jest.fn(),
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
    service = new TicketsService(
      prisma as any,
      redis as any,
      { emit: jest.fn() } as any,
    );
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
    expect(prisma.ticketTimeline.create).not.toHaveBeenCalled();
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
      before: {
        id: 'ticket-id',
        service_engineer_id: 'engineer-id',
        customer_id: 'customer-id',
        mill_id: 'mill-id',
      },
      after: {
        id: 'ticket-id',
        customer_id: 'customer-id',
      },
    });

    expect(prisma.mill.findFirst).toHaveBeenCalledWith({
      where: { id: 'mill-id', deleted_at: null },
    });
  });

  describe('Mobile Role-Based Support Tickets', () => {
    const mockServiceEngineerUser = {
      userId: 'engineer-id',
      role: 'Service Engineer',
    };
    const mockOtherUser = {
      userId: 'other-engineer-id',
      role: 'Service Engineer',
    };
    const mockAdminUser = {
      userId: 'admin-id',
      role: 'SUPER_ADMIN',
    };

    describe('findAll', () => {
      it('should filter by service_engineer_id for Service Engineer', async () => {
        prisma.supportTicket.findMany = jest.fn().mockResolvedValue([]);
        prisma.supportTicket.count = jest.fn().mockResolvedValue(0);

        await service.findAll({}, mockServiceEngineerUser);

        expect(prisma.supportTicket.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              service_engineer_id: 'engineer-id',
            }),
          }),
        );
      });

      it('should not filter by service_engineer_id for Admin', async () => {
        prisma.supportTicket.findMany = jest.fn().mockResolvedValue([]);
        prisma.supportTicket.count = jest.fn().mockResolvedValue(0);

        await service.findAll({}, mockAdminUser);

        expect(prisma.supportTicket.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.not.objectContaining({
              service_engineer_id: 'engineer-id',
            }),
          }),
        );
      });
    });

    describe('findById', () => {
      it('should allow access to assigned ticket for Service Engineer', async () => {
        const ticket = { id: 'ticket-1', service_engineer_id: 'engineer-id' };
        prisma.supportTicket.findUnique.mockResolvedValue(ticket);

        await expect(
          service.findById('ticket-1', mockServiceEngineerUser),
        ).resolves.toEqual(ticket);
      });

      it('should block access to unassigned ticket for Service Engineer', async () => {
        const ticket = { id: 'ticket-1', service_engineer_id: 'engineer-id' };
        prisma.supportTicket.findUnique.mockResolvedValue(ticket);

        await expect(
          service.findById('ticket-1', mockOtherUser),
        ).rejects.toBeInstanceOf(ForbiddenException);
      });

      it('should allow access to any ticket for Admin', async () => {
        const ticket = { id: 'ticket-1', service_engineer_id: 'engineer-id' };
        prisma.supportTicket.findUnique.mockResolvedValue(ticket);

        await expect(
          service.findById('ticket-1', mockAdminUser),
        ).resolves.toEqual(ticket);
      });
    });

    describe('create', () => {
      it('should auto-assign logged-in service engineer ID', async () => {
        const created = { id: 'ticket-1', service_engineer_id: 'engineer-id' };
        prisma.supportTicket.create.mockResolvedValue(created);

        await service.create(
          {
            customer_id: 'customer-id',
            mill_id: 'mill-id',
            subject: 'Printer issue',
            description: 'Printer is not responding',
          },
          mockServiceEngineerUser,
        );

        expect(prisma.supportTicket.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              service_engineer_id: 'engineer-id',
            }),
          }),
        );
        expect(prisma.ticketTimeline.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              ticket_id: 'ticket-1',
              user_id: 'engineer-id',
              notes:
                'Ticket created: Printer issue\n\nDescription: Printer is not responding',
              status: 'OPEN',
            }),
          }),
        );
      });
    });

    describe('update', () => {
      it('should block update of unassigned ticket for Service Engineer', async () => {
        prisma.supportTicket.findUnique.mockResolvedValue({
          id: 'ticket-1',
          service_engineer_id: 'engineer-id',
        });

        await expect(
          service.update('ticket-1', { subject: 'New Subject' }, mockOtherUser),
        ).rejects.toBeInstanceOf(ForbiddenException);
      });

      it('should force service_engineer_id to own ID during update for Service Engineer', async () => {
        const existing = {
          id: 'ticket-1',
          service_engineer_id: 'engineer-id',
          customer_id: 'customer-id',
          mill_id: 'mill-id',
        };
        prisma.supportTicket.findUnique.mockResolvedValue(existing);
        prisma.supportTicket.update.mockResolvedValue({
          ...existing,
          subject: 'Updated subject',
        });

        await service.update(
          'ticket-1',
          { service_engineer_id: 'some-other-id', subject: 'Updated subject' },
          mockServiceEngineerUser,
        );

        expect(prisma.supportTicket.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              service_engineer_id: 'engineer-id',
            }),
          }),
        );
      });

      it('should create a TicketTimeline entry with compiled changes', async () => {
        const existing = {
          id: 'ticket-1',
          service_engineer_id: 'engineer-1',
          customer_id: 'customer-id',
          mill_id: 'mill-id',
          subject: 'Old Subject',
          description: 'Old Description',
          priority: 'MEDIUM',
          status: 'OPEN',
          service_engineer: { full_name: 'Engineer One' },
          customer: { name: 'Customer One' },
          mill: { name: 'Mill One' },
        };
        const updated = {
          ...existing,
          service_engineer_id: 'engineer-2',
          subject: 'New Subject',
          status: 'IN_PROGRESS',
          service_engineer: { full_name: 'Engineer Two' },
        };
        prisma.supportTicket.findUnique.mockResolvedValue(existing);
        prisma.supportTicket.update.mockResolvedValue(updated);

        await service.update(
          'ticket-1',
          {
            subject: 'New Subject',
            status: 'IN_PROGRESS',
            service_engineer_id: 'engineer-2',
          },
          mockAdminUser,
        );

        expect(prisma.ticketTimeline.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              ticket_id: 'ticket-1',
              user_id: 'admin-id',
              notes: expect.stringContaining(
                'Subject: "Old Subject" → "New Subject"',
              ),
              status: 'IN_PROGRESS',
            }),
          }),
        );
        expect(prisma.ticketTimeline.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              notes: expect.stringContaining(
                'Service Engineer: "Engineer One" → "Engineer Two"',
              ),
            }),
          }),
        );
      });
    });

    describe('remove', () => {
      it('should block removal of unassigned ticket for Service Engineer', async () => {
        prisma.supportTicket.findUnique.mockResolvedValue({
          id: 'ticket-1',
          service_engineer_id: 'engineer-id',
        });

        await expect(
          service.remove('ticket-1', mockOtherUser),
        ).rejects.toBeInstanceOf(ForbiddenException);
      });
    });
  });
});
