import { Movement } from '@banking/model';
import { Test, TestingModule } from '@nestjs/testing';
import { useContainer, validate, ValidationArguments } from 'class-validator';
import { DuplicateMovementsFinder } from '../../../movements-validation-services/src/duplicate-movements-finder/duplicate-movements-finder.service';
import { NoDuplicateMovement, NoDuplicatesConstraint } from './no-duplicate-movement.constraint';
describe('NoDuplicatesConstraint', () => {
  let noDuplicatesConstraint: NoDuplicatesConstraint;
  let duplicateMovementsFinder: DuplicateMovementsFinder;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NoDuplicatesConstraint,
        {
          provide: DuplicateMovementsFinder,
          useClass: MockDuplicateMovementsFinder,
        },
      ],
    }).compile();

    useContainer(module, {
      fallbackOnErrors: true,
    });

    duplicateMovementsFinder = module.get<DuplicateMovementsFinder>(
      DuplicateMovementsFinder,
    );
    noDuplicatesConstraint = module.get<NoDuplicatesConstraint>(
      NoDuplicatesConstraint,
    );
  });

  describe('validate', () => {
    it('should return true when no duplicates are found', () => {
      const movements: Movement[] = [
        { id: 1, wording: 'Movement 1', amount: 100, date: new Date() },
        { id: 2, wording: 'Movement 2', amount: 200, date: new Date() },
      ];

      jest
        .spyOn(duplicateMovementsFinder, 'findDuplicateMovements')
        .mockReturnValue([]);

      const result = noDuplicatesConstraint.validate(
        movements,
        {} as ValidationArguments,
      );

      expect(result).toBe(true);
      expect(
        duplicateMovementsFinder.findDuplicateMovements,
      ).toHaveBeenCalledWith(movements.map((tx) => ({ ...tx })));
    });

    it('should return false when duplicates are found', () => {
      const movements: Movement[] = [
        { id: 1, wording: 'Movement 1', amount: 100, date: new Date() },
        { id: 1, wording: 'Movement 1', amount: 100, date: new Date() }, // duplicate
      ];

      jest
        .spyOn(duplicateMovementsFinder, 'findDuplicateMovements')
        .mockReturnValue([movements[0] as Movement]);

      const result = noDuplicatesConstraint.validate(movements, {
        constraints: {},
      } as ValidationArguments);

      expect(result).toBe(false);
      expect(
        duplicateMovementsFinder.findDuplicateMovements,
      ).toHaveBeenCalledWith(movements.map((tx) => ({ ...tx })));
    });
  });

  describe('defaultMessage', () => {
    it('should return a correct error message with duplicate movements', () => {
      const movements: Movement[] = [
        { id: 1, wording: 'Movement 1', amount: 100, date: new Date() },
        { id: 1, wording: 'Movement 1', amount: 100, date: new Date() }, // duplicate
      ];

      jest
        .spyOn(duplicateMovementsFinder, 'findDuplicateMovements')
        .mockReturnValue([movements[0] as Movement]);

      const args: any = {
        constraints: {
          _validationContext: [movements[0]],
        },
      };

      const message = noDuplicatesConstraint.defaultMessage(args);

      expect(message).toBe(
        JSON.stringify({
          message: 'Duplicate bank operations',
          duplicateMovements: [movements[0]],
        }),
      );
    });
  });

  // Mock ValidationService
  class MockDuplicateMovementsFinder {
    findDuplicateMovements(movements: Movement[]): Movement[] {
      return [];
    }
  }

  class TestDto {
    @NoDuplicateMovement({ message: 'Duplicate movements found!' })
    movements: Movement[];

    constructor(movements: Movement[]) {
      this.movements = movements;
    }
  }

  it('should pass validation when there are no duplicate movements', async () => {
    jest
      .spyOn(duplicateMovementsFinder, 'findDuplicateMovements')
      .mockReturnValue([]);

    const testDto = new TestDto([
      { id: 1, wording: 'Movement 1', amount: 100, date: new Date() },
      { id: 2, wording: 'Movement 2', amount: 200, date: new Date() },
    ]);

    const errors = await validate(testDto);

    expect(errors.length).toBe(0); // No errors should be returned
  });

  it('should fail validation when duplicate movements are present', async () => {
    const duplicateMovement: Movement = {
      id: 1,
      wording: 'Movement 1',
      amount: 100,
      date: new Date(),
    };

    jest
      .spyOn(duplicateMovementsFinder, 'findDuplicateMovements')
      .mockReturnValue([duplicateMovement]);

    const testDto = new TestDto([
      duplicateMovement,
      duplicateMovement, // Duplicate movement
    ]);

    const errors = await validate(testDto);

    expect(errors.length).toBe(1); // One validation error should be returned
    expect(errors[0].constraints).toEqual({
      NoDuplicates: 'Duplicate movements found!',
    });
  });
});
