import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getRoles(): Promise<any>;
    findAll(skip?: string, take?: string, search?: string, status?: string, roleId?: string): Promise<any>;
    findOne(id: string): Promise<any>;
    create(dto: CreateUserDto): Promise<any>;
    update(id: string, dto: UpdateUserDto, req: any): Promise<any>;
    remove(id: string): Promise<any>;
}
