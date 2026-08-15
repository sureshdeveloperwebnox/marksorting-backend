import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { Prisma } from '@prisma/client';
import { CreateMasterMillDto } from './dto/create-master-mill.dto';
import { UpdateMasterMillDto } from './dto/update-master-mill.dto';
import { QuickRegisterDto } from './dto/quick-register.dto';
export declare class MasterMillsService {
    private prisma;
    private redis;
    private readonly CACHE_PREFIX;
    private readonly LIST_CACHE_KEY;
    constructor(prisma: PrismaService, redis: RedisService);
    findAll(params: {
        skip?: number;
        take?: number;
        where?: Prisma.MasterMillWhereInput;
        orderBy?: Prisma.MasterMillOrderByWithRelationInput;
    }): Promise<any>;
    findById(id: string): Promise<any>;
    create(dto: CreateMasterMillDto): Promise<any>;
    update(id: string, dto: UpdateMasterMillDto): Promise<{
        before: any;
        after: any;
    }>;
    remove(id: string): Promise<any>;
    getStats(): Promise<any>;
    findForPrefill(search?: string, refNo?: string, frameNo?: string, context?: 'service_report' | 'installation_report'): Promise<any[] | {
        serviceBased: any[];
        installationBased: any[];
    }>;
    quickRegister(dto: QuickRegisterDto, options?: {
        skipDuplicateCheck?: boolean;
    }): Promise<any>;
    private invalidateAllRelatedCaches;
    syncFromServiceReport(params: {
        millId: string;
        frameNo?: string;
        mcModel?: string;
        installationDate?: Date | null;
        place?: string;
    }): Promise<void>;
    private invalidateCache;
    private formatPhoneNumber;
}
