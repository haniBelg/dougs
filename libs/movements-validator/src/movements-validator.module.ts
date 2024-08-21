import { MovementsValidationServicesModule } from '@banking/movements-validation-services';
import { Module } from '@nestjs/common';
import { NoDuplicatesConstraint } from './no-duplicate-movement/no-duplicate-movement.constraint';
import { NoFailedBalanceConstraint } from './no-failed-balance/no-failed-balances.constraint';
import { NoUncontrolledConstraint } from './no-uncontrolled-movement/no-uncontrolled-movement.constraint';

@Module({
  imports: [MovementsValidationServicesModule],
  providers: [NoDuplicatesConstraint, NoFailedBalanceConstraint, NoUncontrolledConstraint],
  exports: [NoDuplicatesConstraint, NoFailedBalanceConstraint, NoUncontrolledConstraint]
})
export class MovementsValidatorModule { }
