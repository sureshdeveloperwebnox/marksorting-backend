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
    update(id: string, dto: UpdateUserDto): Promise<any>;
    remove(id: string): Promise<{
        full_name: string;
        email: string;
        phone_number: string | null;
        role_id: string;
        account_status: string;
        profile_image: string | null;
        background_image: string | null;
        id: string;
        password_hash: string;
        email_verified: boolean;
        phone_verified: boolean;
        last_login_at: Date | null;
        failed_login_attempts: number;
        locked_until: Date | null;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        created_by: string | null;
        updated_by: string | null;
    }>;
}
