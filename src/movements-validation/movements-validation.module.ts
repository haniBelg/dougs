import { MovementsValidatorModule } from '@banking/movements-validator';
import { Module } from '@nestjs/common';
import { ValidationController as MovementsValidationController } from './movements-validation.controller';

@Module({
  imports: [MovementsValidatorModule],
  controllers: [MovementsValidationController],
})
export class MovementsValidationModule { }
