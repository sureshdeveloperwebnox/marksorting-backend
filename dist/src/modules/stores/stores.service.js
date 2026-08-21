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
exports.StoresService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const redis_service_1 = require("../../redis/redis.service");
const event_emitter_1 = require("@nestjs/event-emitter");
const store_warranty_helper_1 = require("./helpers/store-warranty.helper");
let StoresService = class StoresService {
    prisma;
    redis;
    eventEmitter;
    CACHE_PREFIX = 'store:';
    LIST_CACHE_KEY = 'stores:list:';
    constructor(prisma, redis, eventEmitter) {
        this.prisma = prisma;
        this.redis = redis;
        this.eventEmitter = eventEmitter;
    }
    async onModuleInit() {
        await this.invalidateCache();
    }
    async findAll(params) {
        const { skip, take, where, orderBy } = params;
        const cacheKey = `${this.LIST_CACHE_KEY}${JSON.stringify(params)}`;
        const cachedData = await this.redis.getJson(cacheKey);
        if (cachedData)
            return cachedData;
        const [stores, total] = await Promise.all([
            this.prisma.store.findMany({
                skip,
                take,
                where: { ...where, deleted_at: null },
                include: {
                    service_engineer: { select: { id: true, full_name: true } },
                    customer: { select: { id: true, name: true } },
                    materials: {
                        include: {
                            material: { select: { id: true, name: true } },
                        },
                    },
                },
                orderBy,
            }),
            this.prisma.store.count({ where: { ...where, deleted_at: null } }),
        ]);
        const enrichedStores = await this.enrichStoresWithCustomer(stores);
        const result = { stores: enrichedStores, total };
        await this.redis.setJson(cacheKey, result, 300);
        return result;
    }
    async enrichStoresWithCustomer(stores) {
        if (!stores || stores.length === 0)
            return stores;
        const frameNumbers = stores
            .map((s) => s.frame_number?.trim())
            .filter((f) => Boolean(f));
        const customerIds = stores
            .map((s) => s.customer_id || s.customer?.id)
            .filter((c) => Boolean(c));
        const customerByFrame = new Map();
        const millByFrame = new Map();
        const refNoByFrame = new Map();
        const mcModelByFrame = new Map();
        if (frameNumbers.length > 0) {
            const masterMills = await this.prisma.masterMill.findMany({
                where: {
                    frame_no: { in: frameNumbers },
                    deleted_at: null,
                },
                select: {
                    frame_no: true,
                    ref_no: true,
                    mc_model: true,
                    mill: {
                        select: {
                            id: true,
                            name: true,
                            ref_no: true,
                            place: true,
                            address: true,
                            customer: { select: { id: true, name: true } },
                        },
                    },
                },
            });
            for (const mm of masterMills) {
                if (mm.frame_no) {
                    const ref = mm.ref_no || mm.mill?.ref_no;
                    if (ref) {
                        refNoByFrame.set(mm.frame_no, ref);
                    }
                    if (mm.mc_model) {
                        mcModelByFrame.set(mm.frame_no, mm.mc_model);
                    }
                    if (mm.mill) {
                        millByFrame.set(mm.frame_no, {
                            id: mm.mill.id,
                            name: mm.mill.name,
                            ref_no: mm.mill.ref_no || mm.ref_no || undefined,
                            place: mm.mill.place || undefined,
                            address: mm.mill.address || undefined,
                        });
                        if (mm.mill.customer) {
                            customerByFrame.set(mm.frame_no, mm.mill.customer);
                        }
                        else if (mm.mill.name) {
                            customerByFrame.set(mm.frame_no, { id: mm.mill.id, name: mm.mill.name });
                        }
                    }
                }
            }
        }
        const millByCustomerId = new Map();
        if (customerIds.length > 0) {
            const customerMills = await this.prisma.mill.findMany({
                where: {
                    customer_id: { in: customerIds },
                    deleted_at: null,
                },
                select: {
                    id: true,
                    name: true,
                    ref_no: true,
                    place: true,
                    address: true,
                    customer_id: true,
                },
            });
            for (const m of customerMills) {
                if (m.customer_id && !millByCustomerId.has(m.customer_id)) {
                    millByCustomerId.set(m.customer_id, {
                        id: m.id,
                        name: m.name,
                        ref_no: m.ref_no || undefined,
                        place: m.place || undefined,
                        address: m.address || undefined,
                    });
                }
            }
        }
        return stores.map((s) => {
            const fn = s.frame_number?.trim();
            const cid = s.customer_id || s.customer?.id;
            const resolvedCustomer = s.customer ||
                (fn && customerByFrame.has(fn) ? customerByFrame.get(fn) : null);
            const resolvedMill = s.mill ||
                (fn && millByFrame.has(fn) ? millByFrame.get(fn) : null) ||
                (cid && millByCustomerId.has(cid) ? millByCustomerId.get(cid) : null);
            const resolvedRefNo = s.ref_no ||
                (fn && refNoByFrame.has(fn) ? refNoByFrame.get(fn) : null) ||
                resolvedMill?.ref_no ||
                null;
            const resolvedMcModel = s.mc_model ||
                (fn && mcModelByFrame.has(fn) ? mcModelByFrame.get(fn) : null);
            return {
                ...s,
                customer: resolvedCustomer,
                mill: resolvedMill,
                ref_no: resolvedRefNo,
                mc_model: resolvedMcModel,
                is_acknowledge_required: (0, store_warranty_helper_1.isAcknowledgeRequired)(s.warranty_status),
            };
        });
    }
    async findById(id) {
        const cacheKey = `${this.CACHE_PREFIX}id:${id}`;
        const cached = await this.redis.getJson(cacheKey);
        if (cached)
            return cached;
        const store = await this.prisma.store.findFirst({
            where: { id, deleted_at: null },
            include: {
                service_engineer: { select: { id: true, full_name: true } },
                customer: { select: { id: true, name: true } },
                materials: {
                    include: {
                        material: { select: { id: true, name: true } },
                    },
                },
            },
        });
        if (store) {
            const [enrichedStore] = await this.enrichStoresWithCustomer([store]);
            await this.redis.setJson(cacheKey, enrichedStore, 3600);
            return enrichedStore;
        }
        return store;
    }
    async create(dto) {
        const { material_ids, material_quantities, service_engineer_id, customer_id, service_type, mill_id, ...data } = dto;
        if (service_type) {
            if (data.remarks) {
                data.remarks = data.remarks
                    .replace(/\s*\|\s*Service Type:\s*[^\s|)]*/gi, '')
                    .replace(/\s*Service Type:\s*[^\s|)]*/gi, '')
                    .trim();
            }
            const serviceTypeText = `Service Type: ${service_type}`;
            data.remarks = data.remarks
                ? `${data.remarks} | ${serviceTypeText}`
                : serviceTypeText;
        }
        data.frame_number = data.frame_number?.trim() || '';
        let resolvedCustomerId = customer_id;
        if (!resolvedCustomerId && data.frame_number) {
            const masterMill = await this.prisma.masterMill.findFirst({
                where: { frame_no: data.frame_number, deleted_at: null },
                include: { mill: { select: { customer_id: true } } },
            });
            if (masterMill?.mill?.customer_id) {
                resolvedCustomerId = masterMill.mill.customer_id;
            }
        }
        if (!resolvedCustomerId && mill_id) {
            const mill = await this.prisma.mill.findUnique({
                where: { id: mill_id },
                select: { customer_id: true },
            });
            if (mill?.customer_id) {
                resolvedCustomerId = mill.customer_id;
            }
        }
        if (!data.frame_number && mill_id) {
            const masterMill = await this.prisma.masterMill.findFirst({
                where: { mill_id, deleted_at: null },
                select: { frame_no: true },
            });
            if (masterMill?.frame_no) {
                data.frame_number = masterMill.frame_no;
            }
        }
        if (material_quantities && material_quantities.length > 0) {
            data.quantity = material_quantities.reduce((sum, q) => sum + q.quantity, 0);
        }
        const store = await this.prisma.$transaction(async (tx) => {
            const todayStart = new Date();
            todayStart.setUTCHours(0, 0, 0, 0);
            const todayEnd = new Date();
            todayEnd.setUTCHours(23, 59, 59, 999);
            const count = await tx.store.count({
                where: { created_at: { gte: todayStart, lte: todayEnd } },
            });
            const dateStr = todayStart.toISOString().slice(0, 10).replace(/-/g, '');
            const seq = String(count + 1);
            const store_number = `ST-${dateStr}-${seq}`;
            return tx.store.create({
                data: {
                    ...data,
                    store_number,
                    service_engineer: { connect: { id: service_engineer_id } },
                    ...(resolvedCustomerId ? { customer: { connect: { id: resolvedCustomerId } } } : {}),
                    materials: {
                        create: material_ids.map((id) => {
                            const qtyObj = material_quantities?.find((q) => q.material_id === id);
                            return {
                                material: { connect: { id } },
                                quantity: qtyObj ? qtyObj.quantity : 1,
                                stock_type: qtyObj?.stock_type || 'Inflow',
                            };
                        }),
                    },
                },
                include: {
                    service_engineer: { select: { id: true, full_name: true } },
                    customer: { select: { id: true, name: true } },
                    materials: {
                        include: {
                            material: { select: { id: true, name: true } },
                        },
                    },
                },
            });
        });
        await this.invalidateCache();
        this.eventEmitter.emit('store.created', {
            storeId: store.id,
            storeNumber: store.store_number,
            frameNumber: store.frame_number,
            technicianUserId: store.service_engineer_id,
            inflowStatus: store.inflow_status,
            quantity: store.quantity,
        });
        const enriched = (await this.enrichStoresWithCustomer([store]))[0];
        return enriched || store;
    }
    async update(id, dto) {
        const existing = await this.prisma.store.findFirst({
            where: { id, deleted_at: null },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Store record not found');
        }
        const { material_ids, material_quantities, service_engineer_id, customer_id, service_type, mill_id, ...data } = dto;
        if (service_type) {
            if (data.remarks) {
                data.remarks = data.remarks
                    .replace(/\s*\|\s*Service Type:\s*[^\s|)]*/gi, '')
                    .replace(/\s*Service Type:\s*[^\s|)]*/gi, '')
                    .trim();
            }
            const serviceTypeText = `Service Type: ${service_type}`;
            data.remarks = data.remarks
                ? `${data.remarks} | ${serviceTypeText}`
                : serviceTypeText;
        }
        if (dto.frame_number !== undefined) {
            data.frame_number = dto.frame_number?.trim() || '';
        }
        else if (mill_id && !existing.frame_number) {
            const masterMill = await this.prisma.masterMill.findFirst({
                where: { mill_id, deleted_at: null },
                select: { frame_no: true },
            });
            if (masterMill?.frame_no) {
                data.frame_number = masterMill.frame_no;
            }
        }
        let resolvedCustomerId = customer_id;
        if (!resolvedCustomerId && mill_id) {
            const mill = await this.prisma.mill.findUnique({
                where: { id: mill_id },
                select: { customer_id: true },
            });
            if (mill?.customer_id) {
                resolvedCustomerId = mill.customer_id;
            }
        }
        if (material_quantities && material_quantities.length > 0) {
            data.quantity = material_quantities.reduce((sum, q) => sum + q.quantity, 0);
        }
        const store = await this.prisma.store.update({
            where: { id },
            data: {
                ...data,
                service_engineer: service_engineer_id
                    ? { connect: { id: service_engineer_id } }
                    : undefined,
                customer: resolvedCustomerId !== undefined
                    ? (resolvedCustomerId ? { connect: { id: resolvedCustomerId } } : { disconnect: true })
                    : undefined,
                materials: material_ids
                    ? {
                        deleteMany: {},
                        create: material_ids.map((matId) => {
                            const qtyObj = material_quantities?.find((q) => q.material_id === matId);
                            return {
                                material: { connect: { id: matId } },
                                quantity: qtyObj ? qtyObj.quantity : 1,
                                stock_type: qtyObj?.stock_type || 'Inflow',
                            };
                        }),
                    }
                    : undefined,
            },
            include: {
                service_engineer: { select: { id: true, full_name: true } },
                customer: { select: { id: true, name: true } },
                materials: {
                    include: {
                        material: { select: { id: true, name: true } },
                    },
                },
            },
        });
        await this.invalidateCache(id);
        if (store.return_status && store.return_status !== existing.return_status) {
            this.eventEmitter.emit('store.return_updated', {
                storeId: store.id,
                frameNumber: store.frame_number,
                returnStatus: store.return_status,
                technicianUserId: store.service_engineer_id,
            });
        }
        const enrichedAfter = (await this.enrichStoresWithCustomer([store]))[0];
        return { before: existing, after: enrichedAfter || store };
    }
    async remove(id) {
        const existing = await this.prisma.store.findFirst({
            where: { id, deleted_at: null },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Store record not found');
        }
        const store = await this.prisma.store.update({
            where: { id },
            data: { deleted_at: new Date() },
        });
        await this.invalidateCache(id);
        return store;
    }
    async findByTechnician(technicianId, params) {
        const { skip, take, search, return_status, inflow_status, warranty_status, } = params;
        const where = {
            service_engineer_id: technicianId,
            deleted_at: null,
        };
        if (return_status) {
            const lower = return_status.toLowerCase();
            if (lower === 'returned' || lower === 'completed') {
                where.return_status = { in: ['Returned', 'Completed'] };
            }
            else if (lower === 'pending') {
                where.return_status = 'Pending';
            }
            else if (lower === 'in progress' || lower === 'in_progress') {
                where.return_status = 'In Progress';
            }
            else if (lower === 'not returned' || lower === 'not_returned') {
                where.return_status = 'Not Returned';
            }
            else {
                where.return_status = { equals: return_status, mode: 'insensitive' };
            }
        }
        if (inflow_status) {
            where.inflow_status = { equals: inflow_status, mode: 'insensitive' };
        }
        if (warranty_status) {
            where.warranty_status = { equals: warranty_status, mode: 'insensitive' };
        }
        if (search) {
            where.OR = [
                { frame_number: { contains: search, mode: 'insensitive' } },
                { barcode: { contains: search, mode: 'insensitive' } },
                {
                    customer: {
                        name: { contains: search, mode: 'insensitive' },
                    },
                },
            ];
        }
        const [stores, total] = await Promise.all([
            this.prisma.store.findMany({
                skip,
                take,
                where,
                include: {
                    service_engineer: { select: { id: true, full_name: true } },
                    customer: { select: { id: true, name: true } },
                    materials: {
                        include: {
                            material: { select: { id: true, name: true } },
                        },
                    },
                },
                orderBy: { created_at: 'desc' },
            }),
            this.prisma.store.count({ where }),
        ]);
        const enrichedStores = await this.enrichStoresWithCustomer(stores);
        return { stores: enrichedStores, total };
    }
    async findPendingByTechnician(technicianId, params) {
        const { skip, take, search, status } = params || {};
        const returnStatus = status || 'Pending';
        const where = {
            deleted_at: null,
        };
        if (technicianId) {
            where.service_engineer_id = technicianId;
        }
        if (returnStatus.toLowerCase() !== 'all') {
            where.return_status = { equals: returnStatus, mode: 'insensitive' };
        }
        if (search) {
            where.OR = [
                { frame_number: { contains: search, mode: 'insensitive' } },
                { barcode: { contains: search, mode: 'insensitive' } },
                {
                    customer: {
                        name: { contains: search, mode: 'insensitive' },
                    },
                },
            ];
        }
        const [stores, total] = await Promise.all([
            this.prisma.store.findMany({
                skip,
                take,
                where,
                include: {
                    service_engineer: { select: { id: true, full_name: true } },
                    customer: { select: { id: true, name: true } },
                    materials: {
                        include: {
                            material: { select: { id: true, name: true } },
                        },
                    },
                },
                orderBy: { created_at: 'desc' },
            }),
            this.prisma.store.count({ where }),
        ]);
        const enrichedStores = await this.enrichStoresWithCustomer(stores);
        return { stores: enrichedStores, total };
    }
    async submitReturnDetails(storeId, technicianId, dto = {}, isUserAdmin = false) {
        const existing = await this.prisma.store.findFirst({
            where: { id: storeId, deleted_at: null },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Store record not found');
        }
        if (!isUserAdmin && technicianId && existing.service_engineer_id !== technicianId) {
            throw new common_1.ForbiddenException('You are not authorized to update this store record');
        }
        if (!isUserAdmin &&
            (existing.return_status === 'In Progress' ||
                existing.return_status === 'Returned' ||
                existing.return_status === 'Completed')) {
            throw new common_1.BadRequestException('Store return is already completed and locked. It cannot be edited in the app.');
        }
        const hasCourier = Boolean(dto.provider_name &&
            dto.provider_name.trim() !== '' &&
            dto.invoice_number &&
            dto.invoice_number.trim() !== '');
        const targetStatus = hasCourier
            ? 'In Progress'
            : dto.return_status || existing.return_status || 'Pending';
        let finalRemarks = dto.remarks;
        if ((!finalRemarks || finalRemarks.trim() === '') &&
            dto.products &&
            Array.isArray(dto.products)) {
            const extractedRemarks = this.constructRemarksFromProducts(existing.remarks, dto.products, existing.warranty_status);
            if (extractedRemarks) {
                finalRemarks = extractedRemarks;
            }
        }
        const store = await this.prisma.store.update({
            where: { id: storeId },
            data: {
                ...(dto.provider_name !== undefined ? { provider_name: dto.provider_name } : {}),
                ...(dto.invoice_number !== undefined ? { invoice_number: dto.invoice_number } : {}),
                ...(finalRemarks !== undefined ? { remarks: finalRemarks } : {}),
                return_status: targetStatus,
            },
            include: {
                service_engineer: { select: { id: true, full_name: true } },
                customer: { select: { id: true, name: true } },
                materials: {
                    include: {
                        material: { select: { id: true, name: true } },
                    },
                },
            },
        });
        await this.invalidateCache(storeId);
        if (store.return_status && store.return_status !== existing.return_status) {
            this.eventEmitter.emit('store.return_updated', {
                storeId: store.id,
                frameNumber: store.frame_number,
                returnStatus: store.return_status,
                technicianUserId: store.service_engineer_id,
            });
        }
        return {
            before: existing,
            after: store,
            quantity_summary: this.calculateQuantitySummary(store),
        };
    }
    async findByIdAndTechnician(id, technicianId) {
        const store = await this.findById(id);
        if (!store) {
            throw new common_1.NotFoundException('Store record not found');
        }
        if (store.service_engineer_id !== technicianId) {
            throw new common_1.ForbiddenException('You are not authorized to access this store record');
        }
        return store;
    }
    async updateByTechnician(id, technicianId, dto) {
        const existing = await this.prisma.store.findFirst({
            where: { id, deleted_at: null },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Store record not found');
        }
        if (existing.service_engineer_id !== technicianId) {
            throw new common_1.ForbiddenException('You are not authorized to update this store record');
        }
        return this.update(id, dto);
    }
    async removeByTechnician(id, technicianId) {
        const existing = await this.prisma.store.findFirst({
            where: { id, deleted_at: null },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Store record not found');
        }
        if (existing.service_engineer_id !== technicianId) {
            throw new common_1.ForbiddenException('You are not authorized to delete this store record');
        }
        return this.remove(id);
    }
    extractCleanRemarks(remarks) {
        if (!remarks)
            return '';
        let cleaned = remarks;
        const serialIdx = cleaned.search(/\(?\s*Serial Nos:/i);
        if (serialIdx !== -1) {
            cleaned = cleaned.substring(0, serialIdx);
        }
        const stIdx = cleaned.search(/\(?\s*Service Type:/i);
        if (stIdx !== -1) {
            cleaned = cleaned.substring(0, stIdx);
        }
        cleaned = cleaned.replace(/[\(\)\|\s,]+$/, '').trim();
        return cleaned;
    }
    parseServiceTypeFromRemarks(remarks) {
        if (!remarks)
            return 'Acknowledgement';
        const matches = [...remarks.matchAll(/Service Type:\s*([^\s|)]+)/gi)];
        if (matches.length > 0) {
            const lastMatch = matches[matches.length - 1];
            if (lastMatch && lastMatch[1]) {
                const val = lastMatch[1].trim();
                if (/^replacement$/i.test(val))
                    return 'Replacement';
                if (/^acknowledgement|payment$/i.test(val))
                    return 'Acknowledgement';
            }
        }
        return 'Acknowledgement';
    }
    splitSerialsString(str) {
        const result = [];
        let current = '';
        let parenDepth = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str[i];
            if (char === '(') {
                parenDepth++;
                current += char;
            }
            else if (char === ')') {
                if (parenDepth > 0)
                    parenDepth--;
                current += char;
            }
            else if (char === ',' && parenDepth === 0) {
                if (current.trim())
                    result.push(current.trim());
                current = '';
            }
            else {
                current += char;
            }
        }
        if (current.trim()) {
            result.push(current.trim());
        }
        return result.filter((s) => {
            const t = s.trim();
            const isOrphan = /^(RETURNED|NOT_RETURNED|ENG_ACK:|ADM_ACK:)/i.test(t);
            return !isOrphan && t.length > 0;
        });
    }
    cleanBarcodeString(str) {
        let clean = str;
        clean = clean.replace(/\(.*?\)/g, '');
        clean = clean.replace(/\[.*?\]/g, '');
        clean = clean.replace(/(?:,\s*)?(?:RETURNED|NOT_RETURNED|ENG_ACK:[^,;)]+|ADM_ACK:[^,;)]+|RET:[^,;)]+|USED).*/gi, '');
        clean = clean.replace(/[()\[\];,:]+/g, ' ');
        return clean.trim();
    }
    parseSerialMapFromRemarks(remarks) {
        if (!remarks)
            return {};
        const map = {};
        const serialNosIdx = remarks.indexOf('Serial Nos:');
        if (serialNosIdx === -1)
            return {};
        let serialStr = remarks.substring(serialNosIdx + 'Serial Nos:'.length);
        const stIdx = serialStr.indexOf('Service Type:');
        if (stIdx !== -1) {
            serialStr = serialStr.substring(0, stIdx);
        }
        serialStr = serialStr.replace(/[\)\|\s]+$/, '').trim();
        const parts = serialStr.split('|');
        parts.forEach((part) => {
            const colIdx = part.indexOf(':');
            if (colIdx !== -1) {
                const matName = part.substring(0, colIdx).trim();
                const serialsStr = part.substring(colIdx + 1).trim();
                const bracketMatch = serialsStr.match(/\[(.*?)\]/);
                if (bracketMatch && bracketMatch[1]) {
                    const rawSerials = this.splitSerialsString(bracketMatch[1]);
                    const serials = rawSerials
                        .map((s) => s.trim())
                        .filter(Boolean)
                        .map((s) => {
                        const used = /\(USED/i.test(s) || /USED/i.test(s);
                        const isNotReturned = /NOT_RETURNED|RET:Not Returned|Not Returned/i.test(s);
                        const engAckMatch = s.match(/ENG_ACK:(Acknowledged|Pending)/i);
                        const admAckMatch = s.match(/ADM_ACK:(Acknowledged|Pending)/i);
                        const cleanCode = this.cleanBarcodeString(s);
                        return {
                            barcode: cleanCode,
                            used,
                            return_status: used
                                ? isNotReturned
                                    ? 'Not Returned'
                                    : 'Returned'
                                : undefined,
                            engineer_ack: used
                                ? engAckMatch
                                    ? engAckMatch[1]
                                    : 'Acknowledged'
                                : undefined,
                            admin_ack: used
                                ? admAckMatch
                                    ? admAckMatch[1]
                                    : 'Pending'
                                : undefined,
                        };
                    })
                        .filter((s) => s.barcode);
                    map[matName] = serials;
                }
            }
        });
        return map;
    }
    constructRemarksFromProducts(existingRemarks, products, warrantyStatus) {
        if (!products || !Array.isArray(products) || products.length === 0) {
            return null;
        }
        const acknowledgeRequired = (0, store_warranty_helper_1.isAcknowledgeRequired)(warrantyStatus);
        const hasStructuredBarcodes = products.some((p) => p && Array.isArray(p.barcodes) && p.barcodes.length > 0);
        if (hasStructuredBarcodes) {
            const cleanRemarks = this.extractCleanRemarks(existingRemarks);
            const serviceType = this.parseServiceTypeFromRemarks(existingRemarks);
            const currentSerialMap = this.parseSerialMapFromRemarks(existingRemarks);
            for (const prod of products) {
                const matName = prod.material_name || prod.name;
                if (!matName || !Array.isArray(prod.barcodes))
                    continue;
                currentSerialMap[matName] = prod.barcodes.map((b) => {
                    const barcode = b.barcode || (typeof b === 'string' ? b : '');
                    const used = Boolean(b.used);
                    const retStatus = used
                        ? b.return_status === 'Not Returned'
                            ? 'Not Returned'
                            : 'Returned'
                        : undefined;
                    const engAck = used && acknowledgeRequired
                        ? b.acknowledge_status === 'Pending'
                            ? 'Pending'
                            : 'Acknowledged'
                        : undefined;
                    const admAck = used && acknowledgeRequired
                        ? b.admin_acknowledge_status || 'Pending'
                        : undefined;
                    return {
                        barcode,
                        used,
                        return_status: retStatus,
                        engineer_ack: engAck,
                        admin_ack: admAck,
                    };
                });
            }
            const serialSummaries = [];
            Object.entries(currentSerialMap).forEach(([matName, items]) => {
                if (items.length > 0) {
                    const itemStrs = items.map((it) => {
                        if (!it.used)
                            return it.barcode;
                        const tags = ['USED'];
                        if (it.return_status) {
                            tags.push(`RET:${it.return_status}`);
                        }
                        if (acknowledgeRequired) {
                            if (it.engineer_ack)
                                tags.push(`ENG_ACK:${it.engineer_ack}`);
                            if (it.admin_ack)
                                tags.push(`ADM_ACK:${it.admin_ack}`);
                        }
                        return `${it.barcode} (${tags.join('; ')})`;
                    });
                    serialSummaries.push(`${matName}: [${itemStrs.join(', ')}]`);
                }
            });
            const extraParts = [];
            if (serialSummaries.length > 0) {
                extraParts.push(`Serial Nos: ${serialSummaries.join(' | ')}`);
            }
            if (serviceType) {
                extraParts.push(`Service Type: ${serviceType}`);
            }
            const extraText = extraParts.join(' | ');
            return cleanRemarks ? `${cleanRemarks} (${extraText})` : `(${extraText})`;
        }
        const extractedRemarks = products
            .map((p) => {
            if (typeof p === 'string')
                return p;
            if (p && typeof p === 'object') {
                const name = p.name || p.material_name || p.barcode || '';
                const qty = p.quantity !== undefined ? p.quantity : p.qty;
                const parts = [];
                if (name)
                    parts.push(name);
                if (qty !== undefined)
                    parts.push(`qty: ${qty}`);
                if (p.used !== undefined)
                    parts.push(`used: ${p.used}`);
                if (p.return_status)
                    parts.push(`return_status: ${p.return_status}`);
                if (acknowledgeRequired && p.acknowledge_status)
                    parts.push(`acknowledge_status: ${p.acknowledge_status}`);
                return parts.join(' - ');
            }
            return '';
        })
            .filter(Boolean)
            .join(' | ');
        return extractedRemarks || null;
    }
    calculateQuantitySummary(store) {
        const acknowledgeRequired = (0, store_warranty_helper_1.isAcknowledgeRequired)(store?.warranty_status);
        const fullSerialMap = this.parseSerialMapFromRemarks(store?.remarks);
        const materials = store?.materials || [];
        let totalQty = 0;
        let usedQty = 0;
        let returnedQty = 0;
        let notReturnedQty = 0;
        let engAckQty = 0;
        let engPendingQty = 0;
        let admAckQty = 0;
        let admPendingQty = 0;
        const materialsBreakdown = materials.map((m) => {
            const matName = m.material?.name || '';
            const units = fullSerialMap[matName] || [];
            const mTotal = m.quantity || units.length || 1;
            const mUsed = units.filter((u) => u.used).length;
            const mUnused = Math.max(0, mTotal - mUsed);
            const mReturned = units.filter((u) => u.used && u.return_status === 'Returned').length;
            const mNotReturned = units.filter((u) => u.used && u.return_status === 'Not Returned').length;
            const mEngAck = acknowledgeRequired
                ? units.filter((u) => u.used && u.engineer_ack === 'Acknowledged').length
                : 0;
            const mEngPending = acknowledgeRequired
                ? units.filter((u) => u.used && u.engineer_ack === 'Pending').length
                : 0;
            const mAdmAck = acknowledgeRequired
                ? units.filter((u) => u.used && u.admin_ack === 'Acknowledged').length
                : 0;
            const mAdmPending = acknowledgeRequired
                ? units.filter((u) => u.used && u.admin_ack === 'Pending').length
                : 0;
            totalQty += mTotal;
            usedQty += mUsed;
            returnedQty += mReturned;
            notReturnedQty += mNotReturned;
            engAckQty += mEngAck;
            engPendingQty += mEngPending;
            admAckQty += mAdmAck;
            admPendingQty += mAdmPending;
            return {
                material_id: m.material_id,
                material_name: matName,
                total_quantity: mTotal,
                used_quantity: mUsed,
                unused_quantity: mUnused,
                return_status_quantity: {
                    returned: mReturned,
                    not_returned: mNotReturned,
                },
                engineer_ack_quantity: {
                    acknowledged: mEngAck,
                    pending: mEngPending,
                },
                admin_ack_quantity: {
                    acknowledged: mAdmAck,
                    pending: mAdmPending,
                },
            };
        });
        const unusedQty = Math.max(0, totalQty - usedQty);
        return {
            total_quantity: totalQty,
            used_quantity: usedQty,
            unused_quantity: unusedQty,
            is_acknowledge_required: acknowledgeRequired,
            return_status_quantity: {
                returned: returnedQty,
                not_returned: notReturnedQty,
            },
            engineer_ack_quantity: {
                acknowledged: engAckQty,
                pending: engPendingQty,
            },
            admin_ack_quantity: {
                acknowledged: admAckQty,
                pending: admPendingQty,
            },
            materials_breakdown: materialsBreakdown,
        };
    }
    async invalidateCache(id) {
        const promises = [
            this.redis.delByPrefix('stores:'),
            this.redis.delByPrefix('store:'),
        ];
        if (id) {
            promises.push(this.redis.del(`${this.CACHE_PREFIX}id:${id}`));
        }
        await Promise.all(promises);
    }
};
exports.StoresService = StoresService;
exports.StoresService = StoresService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        event_emitter_1.EventEmitter2])
], StoresService);
//# sourceMappingURL=stores.service.js.map