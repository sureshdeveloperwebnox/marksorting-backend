import { StoresService } from './stores.service';

describe('StoresService - submitReturnDetails', () => {
  let service: StoresService;

  const mockPrisma: any = {
    store: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    masterMill: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  const mockRedis: any = {
    del: jest.fn().mockResolvedValue(true),
    delByPrefix: jest.fn().mockResolvedValue(true),
    getJson: jest.fn().mockResolvedValue(null),
    setJson: jest.fn().mockResolvedValue(true),
  };

  const mockEventEmitter: any = {
    emit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new StoresService(
      mockPrisma as any,
      mockRedis as any,
      mockEventEmitter as any,
    );
  });

  it('preserves existing provider_name and invoice_number when incoming values are null or undefined', async () => {
    const existingStore = {
      id: 'store-1',
      store_number: 'STR-8812',
      service_engineer_id: 'tech-1',
      provider_name: 'BlueDart Logistics',
      invoice_number: 'BD-771294812',
      return_status: 'Pending',
      remarks: 'Existing remarks',
      warranty_status: 'Warranty',
      materials: [],
    };

    mockPrisma.store.findFirst.mockResolvedValue(existingStore);
    mockPrisma.store.update.mockImplementation(({ data }: any) =>
      Promise.resolve({
        ...existingStore,
        ...data,
      }),
    );

    const result = await service.submitReturnDetails(
      'store-1',
      'tech-1',
      {
        provider_name: null as any,
        invoice_number: null as any,
        return_status: null as any,
        products: [
          {
            material_id: 'mat-1',
            material_name: 'Sensor PS-100',
            barcodes: [
              {
                barcode: 'BAR-889901',
                used: true,
                return_status: 'Returned',
                acknowledge_status: 'Acknowledged',
              },
            ],
          },
        ],
      },
      false,
    );

    // Verify update call did NOT include provider_name: null or invoice_number: null
    expect(mockPrisma.store.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'store-1' },
        data: expect.not.objectContaining({
          provider_name: null,
          invoice_number: null,
        }),
      }),
    );

    // Verify resulting record preserves the courier details
    expect(result.after.provider_name).toBe('BlueDart Logistics');
    expect(result.after.invoice_number).toBe('BD-771294812');
  });

  it('preserves existing courier details when empty strings are passed', async () => {
    const existingStore = {
      id: 'store-1',
      store_number: 'STR-8812',
      service_engineer_id: 'tech-1',
      provider_name: 'DHL Express',
      invoice_number: 'DHL-999',
      return_status: 'Pending',
      remarks: 'Existing remarks',
      materials: [],
    };

    mockPrisma.store.findFirst.mockResolvedValue(existingStore);
    mockPrisma.store.update.mockImplementation(({ data }: any) =>
      Promise.resolve({
        ...existingStore,
        ...data,
      }),
    );

    const result = await service.submitReturnDetails(
      'store-1',
      'tech-1',
      {
        provider_name: '   ',
        invoice_number: '',
        remarks: 'Updated remark',
      },
      false,
    );

    expect(result.after.provider_name).toBe('DHL Express');
    expect(result.after.invoice_number).toBe('DHL-999');
    expect(result.after.remarks).toBe('Updated remark');
  });

  it('updates provider_name and invoice_number when valid non-empty values are provided', async () => {
    const existingStore = {
      id: 'store-1',
      store_number: 'STR-8812',
      service_engineer_id: 'tech-1',
      provider_name: 'Old Courier',
      invoice_number: 'OLD-111',
      return_status: 'Pending',
      remarks: '',
      materials: [],
    };

    mockPrisma.store.findFirst.mockResolvedValue(existingStore);
    mockPrisma.store.update.mockImplementation(({ data }: any) =>
      Promise.resolve({
        ...existingStore,
        ...data,
      }),
    );

    const result = await service.submitReturnDetails(
      'store-1',
      'tech-1',
      {
        provider_name: 'FedEx Express',
        invoice_number: 'FX-998827361',
        return_status: 'In Progress',
      },
      false,
    );

    expect(result.after.provider_name).toBe('FedEx Express');
    expect(result.after.invoice_number).toBe('FX-998827361');
    expect(result.after.return_status).toBe('In Progress');
  });
});
