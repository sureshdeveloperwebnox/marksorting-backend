import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
export declare class RolesController {
    private readonly rolesService;
    constructor(rolesService: RolesService);
    findAll(skip?: string, take?: string, search?: string): Promise<any>;
    getAllPermissions(): Promise<{
        id: string;
        description: string | null;
        name: string;
    }[]>;
    findOne(id: string): Promise<any>;
    create(dto: CreateRoleDto): Promise<any>;
    update(id: string, dto: UpdateRoleDto): Promise<{
        before: {
            id: string;
            description: string | null;
            created_at: Date;
            updated_at: Date;
            name: string;
        };
        after: any;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
