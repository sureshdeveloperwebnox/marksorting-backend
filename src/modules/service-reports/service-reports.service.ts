import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { CreateServiceReportDto } from './dto/create-service-report.dto';
import { UpdateServiceReportDto } from './dto/update-service-report.dto';

const INCLUDE_SHAPE = {
    mill: { select: { id: true, name: true } },
    serviceCategory: { select: { id: true, name: true } },
    technicians: { include: { technician: { select: { id: true, full_name: true } } } },
} as const;

@Injectable()
export class ServiceReportsService {
    private readonly CACHE_PREFIX = 'service-report:';
    private readonly LIST_CACHE_KEY = 'service-reports:list:';

    constructor(
        private prisma: PrismaService,
        private redis: RedisService,
    ) { }

    async findAll(params: {
        skip?: number;
        take?: number;
        search?: string;
        status?: string;
        serviceCategoryId?: string;
        dateFrom?: string;
        dateTo?: string;
    }) {
        const cacheKey = `${this.LIST_CACHE_KEY}${JSON.stringify(params)}`;
        const cachedData = await this.redis.getJson<any>(cacheKey);
        if (cachedData) return cachedData;

        const { skip, take, search, status, serviceCategoryId, dateFrom, dateTo } = params;

        const where: any = { deleted_at: null };

        if (search) {
            where.OR = [
                { report_number: { contains: search, mode: 'insensitive' } },
                { place: { contains: search, mode: 'insensitive' } },
                { machine_model: { contains: search, mode: 'insensitive' } },
                { serial_or_frame_no: { contains: search, mode: 'insensitive' } },
                { nature_of_complaint: { contains: search, mode: 'insensitive' } },
                { authorized_person: { contains: search, mode: 'insensitive' } },
                { mill: { name: { contains: search, mode: 'insensitive' } } },
            ];
        }

        if (status) {
            where.status = status;
        }

        if (serviceCategoryId) {
            where.service_category_id = serviceCategoryId;
        }

        if (dateFrom || dateTo) {
            where.visit_date = {};
            if (dateFrom) {
                where.visit_date.gte = new Date(dateFrom);
            }
            if (dateTo) {
                where.visit_date.lte = new Date(dateTo);
            }
        }

        const [serviceReports, total] = await Promise.all([
            this.prisma.serviceReport.findMany({
                skip,
                take,
                where,
                include: INCLUDE_SHAPE,
            }),
            this.prisma.serviceReport.count({ where }),
        ]);

        const result = { serviceReports, total };
        await this.redis.setJson(cacheKey, result, 300); // Cache for 5 mins
        return result;
    }

    async findById(id: string) {
        const cacheKey = `${this.CACHE_PREFIX}id:${id}`;
        const cached = await this.redis.getJson<any>(cacheKey);
        if (cached) return cached;

        const serviceReport = await this.prisma.serviceReport.findFirst({
            where: { id, deleted_at: null },
            include: INCLUDE_SHAPE,
        });

        if (!serviceReport) {
            throw new NotFoundException(`Service report with ID "${id}" not found`);
        }

        await this.redis.setJson(cacheKey, serviceReport, 3600); // Cache for 1 hour
        return serviceReport;
    }

    async create(dto: CreateServiceReportDto) {
        const { technician_ids, ...reportData } = dto;

        const serviceReport = await this.prisma.$transaction(async (tx) => {
            // Compute today's UTC date boundaries
            const todayStart = new Date();
            todayStart.setUTCHours(0, 0, 0, 0);
            const todayEnd = new Date();
            todayEnd.setUTCHours(23, 59, 59, 999);

            // Count reports created today
            const count = await tx.serviceReport.count({
                where: { created_at: { gte: todayStart, lte: todayEnd } },
            });

            // Format: SR-YYYYMMDD-XXXX (zero-padded 4 digits, starting at 0001)
            const dateStr = todayStart.toISOString().slice(0, 10).replace(/-/g, '');
            const seq = String(count + 1).padStart(4, '0');
            const report_number = `SR-${dateStr}-${seq}`;

            // Insert the service report record
            const created = await tx.serviceReport.create({
                data: {
                    ...reportData,
                    report_number,
                    visit_date: new Date(reportData.visit_date),
                    call_registered_date: new Date(reportData.call_registered_date),
                    machine_mfg_date: reportData.machine_mfg_date
                        ? new Date(reportData.machine_mfg_date)
                        : undefined,
                    machine_installation_date: reportData.machine_installation_date
                        ? new Date(reportData.machine_installation_date)
                        : undefined,
                },
                include: INCLUDE_SHAPE,
            });

            // Create ServiceReportTechnician join rows
            await tx.serviceReportTechnician.createMany({
                data: technician_ids.map((tid) => ({
                    service_report_id: created.id,
                    technician_id: tid,
                })),
            });

            // Re-fetch with technicians included
            return tx.serviceReport.findFirst({
                where: { id: created.id },
                include: INCLUDE_SHAPE,
            });
        });

        await this.invalidateCache();
        return serviceReport;
    }

    async update(id: string, dto: UpdateServiceReportDto) {
        await this.findById(id);

        const { technician_ids, ...reportData } = dto;

        const updateData: any = { ...reportData };

        if (reportData.visit_date !== undefined) {
            updateData.visit_date = new Date(reportData.visit_date);
        }
        if (reportData.call_registered_date !== undefined) {
            updateData.call_registered_date = new Date(reportData.call_registered_date);
        }
        if (reportData.machine_mfg_date !== undefined) {
            updateData.machine_mfg_date = reportData.machine_mfg_date
                ? new Date(reportData.machine_mfg_date)
                : null;
        }
        if (reportData.machine_installation_date !== undefined) {
            updateData.machine_installation_date = reportData.machine_installation_date
                ? new Date(reportData.machine_installation_date)
                : null;
        }

        const serviceReport = await this.prisma.serviceReport.update({
            where: { id },
            data: updateData,
            include: INCLUDE_SHAPE,
        });

        // Sync technician join table
        if (technician_ids !== undefined) {
            await this.prisma.serviceReportTechnician.deleteMany({
                where: { service_report_id: id },
            });
            await this.prisma.serviceReportTechnician.createMany({
                data: technician_ids.map((tid) => ({
                    service_report_id: id,
                    technician_id: tid,
                })),
            });
        }

        await this.invalidateCache(id);
        return serviceReport;
    }

    async remove(id: string) {
        await this.findById(id);

        const serviceReport = await this.prisma.serviceReport.update({
            where: { id },
            data: { deleted_at: new Date() },
            include: INCLUDE_SHAPE,
        });

        await this.invalidateCache(id);
        return serviceReport;
    }

    private async invalidateCache(id?: string) {
        const promises: Promise<any>[] = [this.redis.delByPrefix(this.LIST_CACHE_KEY)];
        if (id) {
            promises.push(this.redis.del(`${this.CACHE_PREFIX}id:${id}`));
        }
        await Promise.all(promises);
    }
}
