import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
export declare class RolesController {
    private readonly rolesService;
    constructor(rolesService: RolesService);
    findAll(skip?: string, take?: string, search?: string): Promise<any>;
    getAllPermissions(): Promise<{
        id: string;
        name: string;
        description: string | null;
    }[]>;
    findOne(id: string): Promise<any>;
    create(dto: CreateRoleDto): Promise<any>;
    update(id: string, dto: UpdateRoleDto): Promise<{
        before: {
            id: string;
            name: string;
            description: string | null;
            created_at: Date;
            updated_at: Date;
        };
        after: any;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
