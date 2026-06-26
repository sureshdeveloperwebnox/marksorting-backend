import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateMasterMillDto } from './src/modules/master-mills/dto/create-master-mill.dto';

async function test() {
  const data = {
    invoice_no: 'INV-TEST-001',
    amc_closing_date: '',
    warranty_closing_date: '',
    ref_no: 'REF-TEST',
    type: 'Installation'
  };

  const instance = plainToInstance(CreateMasterMillDto, data, { enableImplicitConversion: true });
  console.log('Transformed instance:', instance);
  
  const errors = await validate(instance);
  console.log('Validation errors count:', errors.length);
  if (errors.length > 0) {
    errors.forEach(err => {
      console.log(`- Property: ${err.property}`);
      console.log(`  Constraints:`, err.constraints);
    });
  } else {
    console.log('Validation passed!');
  }
}

test().catch(console.error);
