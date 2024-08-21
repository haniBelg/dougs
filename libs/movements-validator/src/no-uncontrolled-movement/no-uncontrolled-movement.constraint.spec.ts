import { Balance, Movement } from '@banking/model';
import { UncontrolledMovementsFinder } from '@banking/movements-validation-services';
import { Test, TestingModule } from '@nestjs/testing';
import { useContainer, validate } from 'class-validator';
import { NoUncontrolledConstraint, NoUncontrolledMovement } from './no-uncontrolled-movement.constraint';


// Mock ValidationService
class MockUncontrolledMovementsFinder {
  findUncontrolledMovements(
    balances: Balance[],
    movements: Movement[],
  ): Movement[] {
    return [];
  }
}

describe('NoUncontrolledConstraint', () => {
  let noUncontrolledConstraint: NoUncontrolledConstraint;
  let uncontrolledMovementsFinder: UncontrolledMovementsFinder;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NoUncontrolledConstraint,
        {
          provide: UncontrolledMovementsFinder,
          useClass: MockUncontrolledMovementsFinder, // Use mock service
        },
      ],
    }).compile();
    useContainer(module, { fallbackOnErrors: true });

    uncontrolledMovementsFinder = module.get<UncontrolledMovementsFinder>(
      UncontrolledMovementsFinder,
    );
    noUncontrolledConstraint = module.get<NoUncontrolledConstraint>(
      NoUncontrolledConstraint,
    );
  });

  class TestDto {
    @NoUncontrolledMovement({ message: 'Uncontrolled movements found!' })
    movements: Movement[];

    balances: Balance[];

    constructor(balances: Balance[], movements: Movement[]) {
      this.balances = balances;
      this.movements = movements;
    }
  }

  it('should pass validation when there are no uncontrolled movements', async () => {
    // Mock behavior for no uncontrolled movements
    jest
      .spyOn(uncontrolledMovementsFinder, 'findUncontrolledMovements')
      .mockReturnValue([]);

    const testDto = new TestDto(
      [{ date: new Date(), balance: 100 }], // Sample BalanceDto
      [{ id: 1, wording: 'Movement 1', amount: 100, date: new Date() }], // Sample MovementDto
    );

    const errors = await validate(testDto);

    expect(errors.length).toBe(0); // No errors should be returned
  });

  it('should fail validation when uncontrolled movements are present', async () => {
    const uncontrolledMovement: any = {
      id: 1,
      wording: 'Movement 1',
      amount: 100,
      date: new Date(),
    };

    // Mock behavior for uncontrolled movements
    jest
      .spyOn(uncontrolledMovementsFinder, 'findUncontrolledMovements')
      .mockReturnValue([uncontrolledMovement]);

    const testDto = new TestDto(
      [{ date: new Date(), balance: 100 }], // Sample BalanceDto
      [{ id: 1, wording: 'Movement 1', amount: 100, date: new Date() }], // Sample MovementDto
    );

    const errors = await validate(testDto);

    expect(errors.length).toBe(1); // One validation error should be returned
    expect(errors[0].constraints).toEqual({
      NoUncontrolled: 'Uncontrolled movements found!',
    });
  });

  it('should return the correct error message with uncontrolled movements', () => {
    const uncontrolledMovement: any = {
      id: 1,
      wording: 'Movement 1',
      amount: 100,
      date: new Date(),
    };

    jest
      .spyOn(uncontrolledMovementsFinder, 'findUncontrolledMovements')
      .mockReturnValue([uncontrolledMovement]);

    const args: any = {
      constraints: {
        _validationContext: [uncontrolledMovement],
      },
    };

    const message = noUncontrolledConstraint.defaultMessage(args);

    expect(message).toBe(
      JSON.stringify({
        message: 'Uncontrolled bank operations',
        uncontrolledMovements: [uncontrolledMovement],
      }),
    );
  });
});
