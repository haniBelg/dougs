import { Balance, Movement } from '@banking/model';
import { UncontrolledMovementsFinder } from '@banking/movements-validation-services';
import { Inject, Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'NoUncontrolled', async: false })
@Injectable()
export class NoUncontrolledConstraint implements ValidatorConstraintInterface {
  constructor(
    @Inject(UncontrolledMovementsFinder)
    private uncontrolledMovementsFinder: UncontrolledMovementsFinder,
  ) { }

  validate(movements: Movement[], args: ValidationArguments): boolean {
    const request = args.object as {
      balances: Balance[];
      movements: Movement[];
    };
    const balances: Balance[] = request.balances;
    const uncontrolledMovements =
      this.uncontrolledMovementsFinder.findUncontrolledMovements(
        balances,
        movements,
      );
    if (uncontrolledMovements.length > 0) {
      args.constraints['_validationContext'] = uncontrolledMovements;
      return false;
    }
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    const uncontrolledMovements = args.constraints['_validationContext'];
    return JSON.stringify({
      message: 'Uncontrolled bank operations',
      uncontrolledMovements,
    });
  }
}

export function NoUncontrolledMovement(
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: NoUncontrolledConstraint,
    });
  };
}
