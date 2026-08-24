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

  it('keeps return_status as Pending when saving product details even if courier details are present', async () => {
    const existingStore = {
      id: 'store-1',
      store_number: 'STR-8812',
      service_engineer_id: 'tech-1',
      provider_name: 'DHL Test',
      invoice_number: '123456789',
      return_status: 'Pending',
      remarks: '',
      warranty_status: 'Non Warranty',
      materials: [
        {
          material_id: 'mat-1',
          material: { id: 'mat-1', name: 'LED ARRAY' },
          quantity: 2,
        },
      ],
    };

    mockPrisma.store.findFirst.mockResolvedValue(existingStore);
    mockPrisma.store.update.mockImplementation(({ data }: any) =>
      Promise.resolve({
        ...existingStore,
        ...data,
      }),
    );

    // Saving product details for first material without passing return_status
    const result = await service.submitReturnDetails(
      'store-1',
      'tech-1',
      {
        products: [
          {
            material_id: 'mat-1',
            material_name: 'LED ARRAY',
            barcodes: [
              { barcode: 'LED-001', used: true, return_status: 'Returned' },
              { barcode: 'LED-002', used: false },
            ],
          },
        ],
      },
      false,
    );

    // Verify update did not overwrite return_status to 'In Progress' or 'Completed'
    expect(mockPrisma.store.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'store-1' },
        data: expect.not.objectContaining({
          return_status: 'In Progress',
        }),
      }),
    );

    expect(result.after.return_status).toBe('Pending');
  });

  it('allows progressive saving of multiple materials sequentially while keeping status Pending, and only locks upon explicit finalization', async () => {
    let currentStore: any = {
      id: 'store-100',
      store_number: 'STR-9999',
      service_engineer_id: 'tech-1',
      provider_name: 'DHL Test',
      invoice_number: '123456789',
      return_status: 'Pending',
      remarks: '',
      warranty_status: 'Non Warranty',
      materials: [
        {
          material_id: 'mat-1',
          material: { id: 'mat-1', name: 'LED ARRAY' },
          quantity: 2,
        },
        {
          material_id: 'mat-2',
          material: { id: 'mat-2', name: 'ckd roldess cyclinder 1510' },
          quantity: 2,
        },
        {
          material_id: 'mat-3',
          material: { id: 'mat-3', name: 'camera board tt' },
          quantity: 2,
        },
      ],
    };

    mockPrisma.store.findFirst.mockImplementation(() => Promise.resolve(currentStore));
    mockPrisma.store.update.mockImplementation(({ data }: any) => {
      currentStore = {
        ...currentStore,
        ...data,
      };
      return Promise.resolve(currentStore);
    });

    // Step 1: Save Material 1 product details
    const step1Result = await service.submitReturnDetails(
      'store-100',
      'tech-1',
      {
        products: [
          {
            material_id: 'mat-1',
            material_name: 'LED ARRAY',
            barcodes: [
              { barcode: 'LED-001', used: true, return_status: 'Returned' },
              { barcode: 'LED-002', used: false },
            ],
          },
        ],
      },
      false,
    );
    expect(step1Result.after.return_status).toBe('Pending');
    expect(step1Result.after.remarks).toContain('LED ARRAY');

    // Step 2: Save Material 2 product details (must NOT be blocked or locked)
    const step2Result = await service.submitReturnDetails(
      'store-100',
      'tech-1',
      {
        products: [
          {
            material_id: 'mat-2',
            material_name: 'ckd roldess cyclinder 1510',
            barcodes: [
              { barcode: 'CKD-001', used: true, return_status: 'Returned' },
              { barcode: 'CKD-002', used: false },
            ],
          },
        ],
      },
      false,
    );
    expect(step2Result.after.return_status).toBe('Pending');
    expect(step2Result.after.remarks).toContain('LED ARRAY');
    expect(step2Result.after.remarks).toContain('ckd roldess cyclinder 1510');

    // Step 3: Save Material 3 product details (must NOT be blocked or locked)
    const step3Result = await service.submitReturnDetails(
      'store-100',
      'tech-1',
      {
        products: [
          {
            material_id: 'mat-3',
            material_name: 'camera board tt',
            barcodes: [
              { barcode: 'CAM-001', used: true, return_status: 'Returned' },
              { barcode: 'CAM-002', used: false },
            ],
          },
        ],
      },
      false,
    );
    expect(step3Result.after.return_status).toBe('Pending');
    expect(step3Result.after.remarks).toContain('camera board tt');

    // Step 4: Finalize return order explicitly with return_status: 'Returned'
    const step4Result = await service.submitReturnDetails(
      'store-100',
      'tech-1',
      {
        return_status: 'Returned',
      },
      false,
    );
    expect(step4Result.after.return_status).toBe('Returned');

    // Step 5: Verify that once status is 'Returned', subsequent non-admin edit is locked
    await expect(
      service.submitReturnDetails(
        'store-100',
        'tech-1',
        {
          remarks: 'Trying to edit after completion',
        },
        false,
      ),
    ).rejects.toThrow('Store return is already completed and locked. It cannot be edited in the app.');
  });
});
