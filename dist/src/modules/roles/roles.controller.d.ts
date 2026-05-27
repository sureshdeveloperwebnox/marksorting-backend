import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
export declare class RolesController {
    private readonly rolesService;
    constructor(rolesService: RolesService);
    findAll(skip?: string, take?: string, search?: string): Promise<any>;
    findOne(id: string): Promise<any>;
    create(dto: CreateRoleDto): Promise<any>;
    update(id: string, dto: UpdateRoleDto): Promise<any>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
