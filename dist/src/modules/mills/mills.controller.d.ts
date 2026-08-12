import { MillsService } from './mills.service';
import { CreateMillDto } from './dto/create-mill.dto';
import { UpdateMillDto } from './dto/update-mill.dto';
export declare class MillsController {
    private readonly millsService;
    constructor(millsService: MillsService);
    findAll(skip?: string, take?: string, search?: string, refNo?: string, frameNo?: string, status?: string, customerId?: string): Promise<any>;
    findOne(id: string): Promise<any>;
    create(dto: CreateMillDto): Promise<any>;
    update(id: string, dto: UpdateMillDto): Promise<{
        before: any;
        after: any;
    }>;
    remove(id: string): Promise<any>;
}
