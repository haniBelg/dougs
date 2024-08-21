import { Balance, Movement } from '@banking/model';
import { FailedBalancesFinder } from '@banking/movements-validation-services';
import { Inject, Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'NoFailedBalance', async: false })
@Injectable()
export class NoFailedBalanceConstraint
  implements ValidatorConstraintInterface {
  constructor(
    @Inject(FailedBalancesFinder)
    private failedBalancesFinder: FailedBalancesFinder,
  ) { }

  validate(balances: Balance[], args: ValidationArguments): boolean {
    const request = args.object as {
      balances: Balance[];
      movements: Movement[];
    };
    const movements: Movement[] = request.movements;
    const failedBalances =
      this.failedBalancesFinder.findFailedBalances(
        balances,
        movements,
      );
    if (failedBalances.length > 0) {
      args.constraints['_validationContext'] = failedBalances;
      return false;
    }
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    const failedBalances = args.constraints['_validationContext'];
    return JSON.stringify({
      message: 'Failed balances',
      failedBalances,
    });
  }
}

export function NoFailedBalance(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: NoFailedBalanceConstraint,
    });
  };
}
