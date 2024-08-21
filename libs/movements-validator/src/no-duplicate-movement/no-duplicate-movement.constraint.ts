import { Movement } from '@banking/model';
import { DuplicateMovementsFinder } from '@banking/movements-validation-services';
import { Inject, Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'NoDuplicates', async: false })
@Injectable()
export class NoDuplicatesConstraint implements ValidatorConstraintInterface {
  constructor(
    @Inject(DuplicateMovementsFinder)
    private duplicateMovementsFinder: DuplicateMovementsFinder,
  ) { }

  validate(movements: Movement[], args: ValidationArguments): boolean {
    const duplicates =
      this.duplicateMovementsFinder.findDuplicateMovements(movements);
    if (duplicates.length > 0) {
      args.constraints['_validationContext'] = duplicates;
      return false;
    }
    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    const duplicateMovements = args.constraints['_validationContext'];
    return JSON.stringify({
      message: 'Duplicate bank operations',
      duplicateMovements,
    });
  }
}

export function NoDuplicateMovement(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: NoDuplicatesConstraint,
    });
  };
}
