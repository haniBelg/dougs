import { Balance, Movement } from '@banking/model';
import {
  BalanceFailure,
  FailedBalancesFinder
} from '@banking/movements-validation-services';
import { Test, TestingModule } from '@nestjs/testing';
import { useContainer, validate } from 'class-validator';
import { NoFailedBalance, NoFailedBalanceConstraint } from './no-failed-balances.constraint';


// Mock ValidationService
class MockFailedBalancesFinder {
  findFailedBalances(
    balances: Balance[],
    movements: Movement[],
  ): any[] {
    return [];
  }
}

describe('NoFailedBalanceConstraint', () => {
  let noFailedBalanceConstraint: NoFailedBalanceConstraint;
  let failedBalancesFinder: FailedBalancesFinder;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NoFailedBalanceConstraint,
        {
          provide: FailedBalancesFinder,
          useClass: MockFailedBalancesFinder, // Use mock service
        },
      ],
    }).compile();
    useContainer(module, {
      fallbackOnErrors: true,
    });

    failedBalancesFinder = module.get<FailedBalancesFinder>(
      FailedBalancesFinder,
    );
    noFailedBalanceConstraint = module.get<NoFailedBalanceConstraint>(
      NoFailedBalanceConstraint,
    );
  });

  class TestDto {
    @NoFailedBalance({ message: 'Failed balances found!' })
    balances: Balance[];

    movements: Movement[];

    constructor(balances: Balance[], movements: Movement[]) {
      this.balances = balances;
      this.movements = movements;
    }
  }

  it('should pass validation when there are no failed balances', async () => {
    // Mock behavior for no failed balances
    jest
      .spyOn(failedBalancesFinder, 'findFailedBalances')
      .mockReturnValue([]);

    const testDto = new TestDto(
      [{ date: new Date(), balance: 100 }], // Sample BalanceDto
      [{ id: 1, wording: 'Movement 1', amount: 100, date: new Date() }], // Sample Movement
    );

    const errors = await validate(testDto);

    expect(errors.length).toBe(0); // No errors should be returned
  });

  it('should fail validation when failed balances are present', async () => {
    const failedBalance: any = {
      expectedBalance: 100,
      movementsSum: 50,
      initialBalance: { date: new Date(), balance: 50 },
      failedBalance: { date: new Date(), balance: 100 },
    };

    // Mock behavior for failed balances
    jest
      .spyOn(failedBalancesFinder, 'findFailedBalances')
      .mockReturnValue([failedBalance]);

    const testDto = new TestDto(
      [{ date: new Date(), balance: 50 }], // Sample BalanceDto
      [{ id: 1, wording: 'Movement 1', amount: 100, date: new Date() }], // Sample Movement
    );

    const errors = await validate(testDto);

    expect(errors.length).toBe(1); // One validation error should be returned
    expect(errors[0].constraints).toEqual({
      NoFailedBalance: 'Failed balances found!',
    });
  });

  it('should return the correct error message with failed balances', () => {
    const failedBalance: BalanceFailure = {
      expectedBalance: 100,
      movementsSum: 50,
      initialBalance: { date: new Date(), balance: 50 },
      failedBalance: { date: new Date(), balance: 100 },
    };

    jest
      .spyOn(failedBalancesFinder, 'findFailedBalances')
      .mockReturnValue([failedBalance]);

    const args: any = {
      constraints: {
        _validationContext: [failedBalance],
      },
    };

    const message = noFailedBalanceConstraint.defaultMessage(args);

    expect(message).toBe(
      JSON.stringify({
        message: 'Failed balances',
        failedBalances: [failedBalance],
      }),
    );
  });
});
