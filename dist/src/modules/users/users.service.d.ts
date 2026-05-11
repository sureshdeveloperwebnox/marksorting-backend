import { PrismaService } from '../../prisma/prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findByEmail(email: string): Promise<({
        role: {
            permissions: ({
                permission: {
                    id: string;
                    name: string;
                    description: string | null;
                };
            } & {
                role_id: string;
                permission_id: string;
            })[];
        } & {
            id: string;
            name: string;
            description: string | null;
        };
    } & {
        id: string;
        role_id: string;
        email: string;
        phone_number: string | null;
        full_name: string;
        password_hash: string;
        profile_image: string | null;
        email_verified: boolean;
        phone_verified: boolean;
        account_status: string;
        last_login_at: Date | null;
        failed_login_attempts: number;
        locked_until: Date | null;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        created_by: string | null;
        updated_by: string | null;
    }) | null>;
    findById(id: string): Promise<({
        role: {
            permissions: ({
                permission: {
                    id: string;
                    name: string;
                    description: string | null;
                };
            } & {
                role_id: string;
                permission_id: string;
            })[];
        } & {
            id: string;
            name: string;
            description: string | null;
        };
    } & {
        id: string;
        role_id: string;
        email: string;
        phone_number: string | null;
        full_name: string;
        password_hash: string;
        profile_image: string | null;
        email_verified: boolean;
        phone_verified: boolean;
        account_status: string;
        last_login_at: Date | null;
        failed_login_attempts: number;
        locked_until: Date | null;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        created_by: string | null;
        updated_by: string | null;
    }) | null>;
}
