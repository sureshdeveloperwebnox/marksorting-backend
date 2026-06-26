"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MasterMillsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const redis_service_1 = require("../../redis/redis.service");
let MasterMillsService = class MasterMillsService {
    prisma;
    redis;
    CACHE_PREFIX = 'master_mill:';
    LIST_CACHE_KEY = 'master_mills:list:';
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
    }
    async findAll(params) {
        const { skip, take, where, orderBy } = params;
        const cacheKey = `${this.LIST_CACHE_KEY}${JSON.stringify(params)}`;
        const cachedData = await this.redis.getJson(cacheKey);
        if (cachedData)
            return cachedData;
        const [masterMills, total] = await Promise.all([
            this.prisma.masterMill.findMany({
                skip,
                take,
                where: { ...where, deleted_at: null },
                include: {
                    mill: {
                        select: {
                            id: true,
                            name: true,
                            ref_no: true,
                            place: true,
                            phone: true,
                            customer_id: true,
                            customer: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
                },
                orderBy,
            }),
            this.prisma.masterMill.count({ where: { ...where, deleted_at: null } }),
        ]);
        const result = { masterMills, total };
        await this.redis.setJson(cacheKey, result, 300);
        return result;
    }
    async findById(id) {
        const cacheKey = `${this.CACHE_PREFIX}id:${id}`;
        const cached = await this.redis.getJson(cacheKey);
        if (cached)
            return cached;
        const masterMill = await this.prisma.masterMill.findFirst({
            where: { id, deleted_at: null },
            include: {
                mill: {
                    select: {
                        id: true,
                        name: true,
                        ref_no: true,
                        place: true,
                        phone: true,
                        customer_id: true,
                        customer: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });
        if (!masterMill)
            throw new common_1.NotFoundException('Master Mill record not found');
        await this.redis.setJson(cacheKey, masterMill, 3600);
        return masterMill;
    }
    async create(dto) {
        const data = { ...dto };
        if (!data.warranty_closing_date && data.installation_date) {
            const installDate = new Date(data.installation_date);
            const years = data.warranty_years ?? 0;
            const months = data.warranty_months ?? 0;
            installDate.setFullYear(installDate.getFullYear() + years);
            installDate.setMonth(installDate.getMonth() + months);
            data.warranty_closing_date = installDate.toISOString();
        }
        if (!data.amc_closing_date && data.amc_starting_date && data.amc_period) {
            const amcStart = new Date(data.amc_starting_date);
            amcStart.setMonth(amcStart.getMonth() + data.amc_period);
            data.amc_closing_date = amcStart.toISOString();
        }
        if (data.invoice_date)
            data.invoice_date = new Date(data.invoice_date);
        if (data.installation_date)
            data.installation_date = new Date(data.installation_date);
        if (data.warranty_closing_date)
            data.warranty_closing_date = new Date(data.warranty_closing_date);
        if (data.amc_starting_date)
            data.amc_starting_date = new Date(data.amc_starting_date);
        if (data.amc_closing_date)
            data.amc_closing_date = new Date(data.amc_closing_date);
        await this.prisma.masterMill.create({ data });
        await this.invalidateCache();
        const created = await this.prisma.masterMill.findFirst({
            where: { invoice_no: data.invoice_no, deleted_at: null },
            include: {
                mill: {
                    select: {
                        id: true,
                        name: true,
                        ref_no: true,
                        place: true,
                        phone: true,
                        customer_id: true,
                        customer: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });
        return created;
    }
    async update(id, dto) {
        const existing = await this.prisma.masterMill.findFirst({
            where: { id, deleted_at: null },
        });
        if (!existing)
            throw new common_1.NotFoundException('Master Mill record not found');
        const data = { ...dto };
        const installDate = data.installation_date
            ? new Date(data.installation_date)
            : existing.installation_date
                ? new Date(existing.installation_date)
                : null;
        if (installDate && !data.warranty_closing_date) {
            const years = data.warranty_years ?? existing.warranty_years ?? 0;
            const months = data.warranty_months ?? existing.warranty_months ?? 0;
            const closing = new Date(installDate);
            closing.setFullYear(closing.getFullYear() + years);
            closing.setMonth(closing.getMonth() + months);
            data.warranty_closing_date = closing.toISOString();
        }
        const amcStart = data.amc_starting_date
            ? new Date(data.amc_starting_date)
            : existing.amc_starting_date
                ? new Date(existing.amc_starting_date)
                : null;
        const amcPeriod = data.amc_period ?? existing.amc_period;
        if (amcStart && amcPeriod && !data.amc_closing_date) {
            const amcClose = new Date(amcStart);
            amcClose.setMonth(amcClose.getMonth() + amcPeriod);
            data.amc_closing_date = amcClose.toISOString();
        }
        if (data.invoice_date)
            data.invoice_date = new Date(data.invoice_date);
        if (data.installation_date)
            data.installation_date = new Date(data.installation_date);
        if (data.warranty_closing_date)
            data.warranty_closing_date = new Date(data.warranty_closing_date);
        if (data.amc_starting_date)
            data.amc_starting_date = new Date(data.amc_starting_date);
        if (data.amc_closing_date)
            data.amc_closing_date = new Date(data.amc_closing_date);
        const updated = await this.prisma.masterMill.update({
            where: { id },
            data,
        });
        await this.invalidateCache(id);
        return { before: existing, after: updated };
    }
    async remove(id) {
        const existing = await this.prisma.masterMill.findFirst({
            where: { id, deleted_at: null },
        });
        if (!existing)
            throw new common_1.NotFoundException('Master Mill record not found');
        const deleted = await this.prisma.masterMill.update({
            where: { id },
            data: { deleted_at: new Date(), status: 'DELETED' },
        });
        await this.invalidateCache(id);
        return deleted;
    }
    async getStats() {
        const cacheKey = `${this.LIST_CACHE_KEY}stats`;
        const cached = await this.redis.getJson(cacheKey);
        if (cached)
            return cached;
        const now = new Date();
        const [total, underWarranty, underAmc, nonWarranty, installationCount, serviceCount,] = await Promise.all([
            this.prisma.masterMill.count({ where: { deleted_at: null } }),
            this.prisma.masterMill.count({
                where: {
                    deleted_at: null,
                    all_warranty: 'Under Warranty',
                },
            }),
            this.prisma.masterMill.count({
                where: {
                    deleted_at: null,
                    all_warranty: 'Under AMC',
                },
            }),
            this.prisma.masterMill.count({
                where: { deleted_at: null, all_warranty: 'Non Warranty' },
            }),
            this.prisma.masterMill.count({
                where: { deleted_at: null, type: 'Installation' },
            }),
            this.prisma.masterMill.count({
                where: { deleted_at: null, type: 'Service' },
            }),
        ]);
        const result = {
            total,
            underWarranty,
            underAmc,
            nonWarranty,
            installationCount,
            serviceCount,
        };
        await this.redis.setJson(cacheKey, result, 120);
        return result;
    }
    async findForPrefill(search, refNo, frameNo) {
        if (!search && !refNo && !frameNo) {
            return [];
        }
        const where = {
            deleted_at: null,
            status: 'ACTIVE',
        };
        if (search) {
            const cleanSearch = search.trim();
            where.OR = [
                { ref_no: { contains: cleanSearch, mode: 'insensitive' } },
                { frame_no: { contains: cleanSearch, mode: 'insensitive' } },
                { mill: { name: { contains: cleanSearch, mode: 'insensitive' } } },
                {
                    mill: {
                        customer: { name: { contains: cleanSearch, mode: 'insensitive' } },
                    },
                },
            ];
        }
        else {
            const orConditions = [];
            if (refNo) {
                orConditions.push({
                    ref_no: { contains: refNo.trim(), mode: 'insensitive' },
                });
            }
            if (frameNo) {
                orConditions.push({
                    frame_no: { contains: frameNo.trim(), mode: 'insensitive' },
                });
            }
            if (orConditions.length > 0) {
                where.OR = orConditions;
            }
        }
        return this.prisma.masterMill.findMany({
            where,
            include: {
                mill: {
                    include: {
                        customer: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                phone: true,
                            },
                        },
                    },
                },
            },
            take: 10,
        });
    }
    async quickRegister(dto) {
        const customerIdInput = dto.customer_id?.trim();
        const customerNameInput = dto.customer_name?.trim();
        if (!customerIdInput && !customerNameInput) {
            throw new common_1.BadRequestException('Either customer_id or customer_name must be provided');
        }
        const cleanMillName = dto.mill_name.trim();
        const cleanRefNo = dto.ref_no.trim();
        const cleanFrameNo = dto.frame_no?.trim();
        const cleanMcModel = dto.mc_model?.trim();
        const cleanAddress = dto.address?.trim();
        const cleanPlace = dto.place.trim();
        const cleanState = dto.state?.trim();
        const cleanPhone = dto.phone?.trim();
        const cleanEmail = dto.email?.trim();
        const result = await this.prisma.$transaction(async (tx) => {
            let customer = null;
            if (customerIdInput) {
                customer = await tx.customer.findFirst({
                    where: { id: customerIdInput, deleted_at: null },
                });
                if (!customer) {
                    throw new common_1.BadRequestException('Provided Customer ID does not exist');
                }
                const customerUpdates = {};
                if (cleanAddress && customer.address !== cleanAddress)
                    customerUpdates.address = cleanAddress;
                if (cleanPhone && customer.phone !== cleanPhone)
                    customerUpdates.phone = cleanPhone;
                if (cleanEmail && customer.email !== cleanEmail)
                    customerUpdates.email = cleanEmail;
                if (Object.keys(customerUpdates).length > 0) {
                    customer = await tx.customer.update({
                        where: { id: customer.id },
                        data: customerUpdates,
                    });
                }
            }
            else {
                const cleanCustName = customerNameInput;
                customer = await tx.customer.findFirst({
                    where: {
                        name: { equals: cleanCustName, mode: 'insensitive' },
                        deleted_at: null,
                    },
                });
                if (customer) {
                    const customerUpdates = {};
                    if (cleanAddress && customer.address !== cleanAddress)
                        customerUpdates.address = cleanAddress;
                    if (cleanPhone && customer.phone !== cleanPhone)
                        customerUpdates.phone = cleanPhone;
                    if (cleanEmail && customer.email !== cleanEmail)
                        customerUpdates.email = cleanEmail;
                    if (Object.keys(customerUpdates).length > 0) {
                        customer = await tx.customer.update({
                            where: { id: customer.id },
                            data: customerUpdates,
                        });
                    }
                }
                else {
                    customer = await tx.customer.create({
                        data: {
                            name: cleanCustName,
                            address: cleanAddress,
                            phone: cleanPhone,
                            email: cleanEmail,
                            status: 'ACTIVE',
                        },
                    });
                }
            }
            const resolvedCustomerId = customer.id;
            let mill = await tx.mill.findFirst({
                where: {
                    name: { equals: cleanMillName, mode: 'insensitive' },
                    customer_id: resolvedCustomerId,
                    deleted_at: null,
                },
            });
            if (mill) {
                const millUpdates = {};
                if (cleanAddress && mill.address !== cleanAddress)
                    millUpdates.address = cleanAddress;
                if (cleanPhone && mill.phone !== cleanPhone)
                    millUpdates.phone = cleanPhone;
                if (cleanEmail && mill.email !== cleanEmail)
                    millUpdates.email = cleanEmail;
                if (cleanPlace && mill.place !== cleanPlace)
                    millUpdates.place = cleanPlace;
                if (cleanRefNo && mill.ref_no !== cleanRefNo)
                    millUpdates.ref_no = cleanRefNo;
                if (Object.keys(millUpdates).length > 0) {
                    mill = await tx.mill.update({
                        where: { id: mill.id },
                        data: millUpdates,
                    });
                }
            }
            else {
                mill = await tx.mill.create({
                    data: {
                        name: cleanMillName,
                        customer_id: resolvedCustomerId,
                        address: cleanAddress,
                        phone: cleanPhone,
                        place: cleanPlace,
                        ref_no: cleanRefNo,
                        email: cleanEmail,
                        status: 'ACTIVE',
                    },
                });
            }
            const resolvedMillId = mill.id;
            const orConditions = [];
            if (cleanRefNo) {
                orConditions.push({
                    ref_no: { equals: cleanRefNo, mode: 'insensitive' },
                });
            }
            if (cleanFrameNo) {
                orConditions.push({
                    frame_no: { equals: cleanFrameNo, mode: 'insensitive' },
                });
            }
            let masterMill = await tx.masterMill.findFirst({
                where: {
                    deleted_at: null,
                    mill_id: resolvedMillId,
                    OR: orConditions.length > 0 ? orConditions : undefined,
                },
            });
            if (masterMill) {
                const masterMillUpdates = {};
                if (cleanRefNo && masterMill.ref_no !== cleanRefNo)
                    masterMillUpdates.ref_no = cleanRefNo;
                if (cleanFrameNo && masterMill.frame_no !== cleanFrameNo)
                    masterMillUpdates.frame_no = cleanFrameNo;
                if (cleanMcModel && masterMill.mc_model !== cleanMcModel)
                    masterMillUpdates.mc_model = cleanMcModel;
                if (cleanAddress && masterMill.address !== cleanAddress)
                    masterMillUpdates.address = cleanAddress;
                if (cleanPlace && masterMill.place !== cleanPlace)
                    masterMillUpdates.place = cleanPlace;
                if (cleanState && masterMill.state !== cleanState)
                    masterMillUpdates.state = cleanState;
                if (cleanPhone && masterMill.phone_no !== cleanPhone)
                    masterMillUpdates.phone_no = cleanPhone;
                if (dto.type && masterMill.type !== dto.type)
                    masterMillUpdates.type = dto.type;
                if (masterMill.mill_id !== resolvedMillId)
                    masterMillUpdates.mill_id = resolvedMillId;
                if (Object.keys(masterMillUpdates).length > 0) {
                    masterMill = await tx.masterMill.update({
                        where: { id: masterMill.id },
                        data: masterMillUpdates,
                    });
                }
            }
            else {
                const fallbackInvoiceNo = `INV-QR-${cleanRefNo}-${Date.now()}`;
                masterMill = await tx.masterMill.create({
                    data: {
                        invoice_no: fallbackInvoiceNo,
                        ref_no: cleanRefNo,
                        frame_no: cleanFrameNo,
                        mc_model: cleanMcModel,
                        address: cleanAddress,
                        place: cleanPlace,
                        state: cleanState,
                        phone_no: cleanPhone,
                        mill_id: resolvedMillId,
                        status: 'ACTIVE',
                        type: dto.type || 'Installation',
                    },
                });
            }
            return tx.masterMill.findUnique({
                where: { id: masterMill.id },
                include: {
                    mill: {
                        include: {
                            customer: true,
                        },
                    },
                },
            });
        });
        await this.invalidateAllRelatedCaches(result?.mill?.customer_id ?? undefined, result?.mill_id ?? undefined, result?.id ?? undefined);
        return result;
    }
    async invalidateAllRelatedCaches(customerId, millId, masterMillId) {
        const promises = [
            this.redis.delByPrefix('customers:list:'),
            this.redis.delByPrefix('mills:list:'),
            this.redis.delByPrefix('master_mills:list:'),
        ];
        if (customerId)
            promises.push(this.redis.del(`customer:id:${customerId}`));
        if (millId)
            promises.push(this.redis.del(`mill:id:${millId}`));
        if (masterMillId)
            promises.push(this.redis.del(`${this.CACHE_PREFIX}id:${masterMillId}`));
        await Promise.all(promises);
    }
    async syncFromServiceReport(params) {
        try {
            const { millId, frameNo, mcModel, installationDate, place } = params;
            const mill = await this.prisma.mill.findUnique({
                where: { id: millId },
                include: { customer: true },
            });
            if (!mill)
                return;
            const existing = await this.prisma.masterMill.findFirst({
                where: {
                    deleted_at: null,
                    type: 'Service',
                    mill_id: millId,
                },
            });
            if (existing) {
                const updates = {};
                if (frameNo && frameNo.trim() && existing.frame_no !== frameNo.trim())
                    updates.frame_no = frameNo.trim();
                if (mcModel && mcModel.trim() && existing.mc_model !== mcModel.trim())
                    updates.mc_model = mcModel.trim();
                if (installationDate && !existing.installation_date)
                    updates.installation_date = installationDate;
                if (place && place.trim() && existing.place !== place.trim())
                    updates.place = place.trim();
                if (existing.mill_id !== millId)
                    updates.mill_id = millId;
                if (existing.type !== 'Installation')
                    updates.type = 'Service';
                if (Object.keys(updates).length > 0) {
                    await this.prisma.masterMill.update({
                        where: { id: existing.id },
                        data: updates,
                    });
                }
            }
            else {
                const fallbackInvoiceNo = `INV-SR-${mill.ref_no || millId.slice(0, 8)}-${Date.now()}`;
                await this.prisma.masterMill.create({
                    data: {
                        invoice_no: fallbackInvoiceNo,
                        ref_no: mill.ref_no || undefined,
                        frame_no: frameNo?.trim() || undefined,
                        mc_model: mcModel?.trim() || undefined,
                        installation_date: installationDate || undefined,
                        address: mill.address || undefined,
                        place: place?.trim() || mill.place || undefined,
                        phone_no: mill.phone || undefined,
                        mill_id: millId,
                        status: 'ACTIVE',
                        type: 'Service',
                    },
                });
            }
            await this.redis.delByPrefix(this.LIST_CACHE_KEY);
        }
        catch (error) {
            console.error('Error in syncFromServiceReport:', error);
        }
    }
    async invalidateCache(id) {
        const promises = [
            this.redis.delByPrefix(this.LIST_CACHE_KEY),
        ];
        if (id) {
            promises.push(this.redis.del(`${this.CACHE_PREFIX}id:${id}`));
        }
        await Promise.all(promises);
    }
};
exports.MasterMillsService = MasterMillsService;
exports.MasterMillsService = MasterMillsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], MasterMillsService);
//# sourceMappingURL=master-mills.service.js.map