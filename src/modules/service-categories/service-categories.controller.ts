import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ServiceCategoriesService } from './service-categories.service';

@ApiTags('service-categories')
@Controller('service-categories')
export class ServiceCategoriesController {
    constructor(private readonly serviceCategoriesService: ServiceCategoriesService) { }
}
