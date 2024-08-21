import { Balance, Movement } from '@banking/model';
import { Test, TestingModule } from '@nestjs/testing';
import { ChunkGenerator, MemoisedChunkGenerator } from '../chunk-generator/chunk-generator.service';
import { ChunkGeneratorImpl } from '../chunk-generator/chunk-generator.service.impl';
import { MemoisedChunkGeneratorImpl } from '../chunk-generator/memoized-chunk-generator.service.impl';
import { UncontrolledMovementsFinder } from './uncontrolled-movements-finder.service';
import { UncontrolledMovementsFinderImpl } from './uncontrolled-movements-finder.service.impl';

describe('findUncontrolledMovements', () => {
  let uncontrolledMovementsFinder: UncontrolledMovementsFinder;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ChunkGenerator,
          useClass: ChunkGeneratorImpl,
        },
        {
          provide: MemoisedChunkGenerator,
          useClass: MemoisedChunkGeneratorImpl,
        },
        {
          provide: UncontrolledMovementsFinder,
          useClass: UncontrolledMovementsFinderImpl,
        },
      ],
    }).compile();

    uncontrolledMovementsFinder = module.get<UncontrolledMovementsFinder>(
      UncontrolledMovementsFinder,
    );
  });

  it('should return an empty array when all movements are within balances', () => {
    const balances: Balance[] = [
      { date: new Date('2023-01-01'), balance: 1000 },
      { date: new Date('2023-02-01'), balance: 1200 },
    ];
    const movements: Movement[] = [
      {
        id: 1,
        wording: 'Movement 1',
        amount: 100,
        date: new Date('2023-01-10'),
      },
    ];

    const result = uncontrolledMovementsFinder.findUncontrolledMovements(
      balances,
      movements,
    );

    expect(result).toEqual([]);
  });

  it('should return uncontrolled movements when they are outside of balances', () => {
    const balances: Balance[] = [
      { date: new Date('2023-01-01'), balance: 1000 },
      { date: new Date('2023-02-01'), balance: 1200 },
    ];
    const movements: Movement[] = [
      {
        id: 1,
        wording: 'Movement 1',
        amount: 100,
        date: new Date('2023-01-10'),
      },
      {
        id: 2,
        wording: 'Movement 2',
        amount: 200,
        date: new Date('2023-03-10'),
      }, // uncontrolled
    ];

    const result = uncontrolledMovementsFinder.findUncontrolledMovements(
      balances,
      movements,
    );

    expect(result).toEqual([movements[1]]);
  });

  it('should return all movements as uncontrolled when there are no balances', () => {
    const balances: Balance[] = [];
    const movements: Movement[] = [
      {
        id: 1,
        wording: 'Movement 1',
        amount: 100,
        date: new Date('2023-01-10'),
      },
      {
        id: 2,
        wording: 'Movement 2',
        amount: 200,
        date: new Date('2023-02-10'),
      },
    ];

    const result = uncontrolledMovementsFinder.findUncontrolledMovements(
      balances,
      movements,
    );

    expect(result).toEqual(movements); // All movements are uncontrolled
  });
  it('should handle complex case with mixed valid and invalid movements and balances', () => {
    const balances: Balance[] = [
      { date: new Date('2023-01-01'), balance: 1000 },
      { date: new Date('2023-02-01'), balance: 1200 },
      { date: new Date('2023-03-01'), balance: 1300 },
    ];
    const movements: Movement[] = [
      {
        id: 1,
        wording: 'Movement 1',
        amount: 100,
        date: new Date('2023-01-10'),
      },
      {
        id: 2,
        wording: 'Movement 2',
        amount: 200,
        date: new Date('2023-02-10'),
      },
      {
        id: 3,
        wording: 'Movement 3',
        amount: -100,
        date: new Date('2023-03-05'),
      },
      {
        id: 4,
        wording: 'Uncontrolled Movement',
        amount: 50,
        date: new Date('2023-04-01'),
      },
    ];

    const uncontrolledMovements =
      uncontrolledMovementsFinder.findUncontrolledMovements(
        balances,
        movements,
      );
    expect(uncontrolledMovements).toEqual([
      movements[2],
      movements[3],
    ]);
  });
});
