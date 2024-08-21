import { Movement } from '@banking/model';
import { Test, TestingModule } from '@nestjs/testing';
import { DuplicateMovementsFinder } from './duplicate-movements-finder.service';
import { DuplicateMovementsFinderImpl } from './duplicate-movements-finder.service.impl';

describe('findDuplicateMovements', () => {
  let duplicateMovementsFinder: DuplicateMovementsFinder;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: DuplicateMovementsFinder,
          useClass: DuplicateMovementsFinderImpl,
        },
      ],
    }).compile();

    duplicateMovementsFinder = module.get<DuplicateMovementsFinder>(
      DuplicateMovementsFinder,
    );
  });

  it('should return an empty array when there are no movements', () => {
    const movements: Movement[] = [];

    const result =
      duplicateMovementsFinder.findDuplicateMovements(movements);

    expect(result).toEqual([]);
  });

  it('should return an empty array when there are no duplicate movements', () => {
    const movements: Movement[] = [
      { id: 1, wording: 'Movement 1', amount: 100, date: new Date() },
      { id: 2, wording: 'Movement 2', amount: 200, date: new Date() },
    ];

    const result =
      duplicateMovementsFinder.findDuplicateMovements(movements);

    expect(result).toEqual([]);
  });

  it('should return duplicate movements', () => {
    const movements: Movement[] = [
      {
        id: 1,
        wording: 'Movement 1',
        amount: 100,
        date: new Date('2024-01-01'),
      },
      {
        id: 2,
        wording: 'Movement 2',
        amount: 200,
        date: new Date('2024-01-01'),
      },
      {
        id: 1,
        wording: 'Duplicate Movement 1',
        amount: 100,
        date: new Date('2024-01-01'),
      },
    ];

    const result =
      duplicateMovementsFinder.findDuplicateMovements(movements);

    expect(result).toEqual([
      {
        id: 1,
        wording: 'Duplicate Movement 1',
        amount: 100,
        date: new Date('2024-01-01'),
      },
    ]);
  });
});
