import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getRoles(): Promise<any>;
    findAll(skip?: string, take?: string, search?: string, status?: string): Promise<any>;
    findOne(id: string): Promise<any>;
    create(dto: CreateUserDto): Promise<any>;
    update(id: string, dto: UpdateUserDto): Promise<{
        before: any;
        after: any;
    }>;
    remove(id: string): Promise<{
        id: string;
        created_at: Date;
        full_name: string;
        email: string;
        phone_number: string | null;
        password_hash: string;
        profile_image: string | null;
        background_image: string | null;
        role_id: string;
        email_verified: boolean;
        phone_verified: boolean;
        account_status: string;
        last_login_at: Date | null;
        failed_login_attempts: number;
        locked_until: Date | null;
        updated_at: Date;
        deleted_at: Date | null;
        created_by: string | null;
        updated_by: string | null;
    }>;
}
