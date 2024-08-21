import { Balance, Movement } from '@banking/model';
import { Test, TestingModule } from '@nestjs/testing';
import { ChunkGenerator, MemoisedChunkGenerator } from '../chunk-generator/chunk-generator.service';
import { ChunkGeneratorImpl } from '../chunk-generator/chunk-generator.service.impl';
import { MemoisedChunkGeneratorImpl } from '../chunk-generator/memoized-chunk-generator.service.impl';
import { FailedBalancesFinder } from './failed-balances-finder.service';
import { FailedBalancesFinderImpl } from './failed-balances-finder.service.impl';

describe('findFailedBalances', () => {
  let failedBalancesFinder: FailedBalancesFinder;

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
          provide: FailedBalancesFinder,
          useClass: FailedBalancesFinderImpl,
        },
      ],
    }).compile();

    failedBalancesFinder = module.get<FailedBalancesFinder>(
      FailedBalancesFinder,
    );
  });

  it('should return failed balances when the balance check fails', () => {
    const balances: Balance[] = [
      { date: new Date('2023-01-01'), balance: 1000 },
      { date: new Date('2023-02-01'), balance: 1200 },
    ];
    const movements: Movement[] = [
      {
        id: 1,
        wording: 'Movement 1',
        amount: 50,
        date: new Date('2023-01-10'),
      },
      {
        id: 2,
        wording: 'Movement 2',
        amount: 100,
        date: new Date('2023-01-20'),
      },
    ];

    const result = failedBalancesFinder.findFailedBalances(
      balances,
      movements,
    );

    expect(result.length).toBe(1);
    expect(result[0]).toEqual({
      expectedBalance: 1150, // 1000 + 50 + 100
      failedBalance: balances[1],
      movementsSum: 150,
      initialBalance: balances[0],
    });
  });

  it('should return an empty array when all balances are correct', () => {
    const balances: Balance[] = [
      { date: new Date('2023-01-01'), balance: 1000 },
      { date: new Date('2023-02-01'), balance: 1150 },
    ];
    const movements: Movement[] = [
      {
        id: 1,
        wording: 'Movement 1',
        amount: 50,
        date: new Date('2023-01-10'),
      },
      {
        id: 2,
        wording: 'Movement 2',
        amount: 100,
        date: new Date('2023-01-20'),
      },
    ];

    const result = failedBalancesFinder.findFailedBalances(
      balances,
      movements,
    );

    expect(result).toEqual([]); // No failed balances
  });

  it('should handle balances with no movements correctly', () => {
    const balances: Balance[] = [
      { date: new Date('2023-01-01'), balance: 1000 },
      { date: new Date('2023-02-01'), balance: 1000 },
    ];
    const movements: Movement[] = []; // No movements

    const result = failedBalancesFinder.findFailedBalances(
      balances,
      movements,
    );

    expect(result).toEqual([]); // No failed balances as balances match and no movements to affect them
  });

  it('should ignore validation for movements who are not delimeted by two balances', () => {
    const balances: Balance[] = [
      { date: new Date('2023-01-01'), balance: 1000 },
    ];
    const movements: Movement[] = [
      {
        id: 1,
        wording: 'Movement 1',
        amount: 50,
        date: new Date('2023-01-10'),
      },
    ];

    const result = failedBalancesFinder.findFailedBalances(
      balances,
      movements,
    );

    expect(result).toEqual([]); // Can't verify without an end balance
  });

  it('should handle complex case with mixed valid and invalid movements and balances', () => {
    const balances: Balance[] = [
      { date: new Date('2023-01-01'), balance: 1000 },
      { date: new Date('2023-02-01'), balance: 1100 },
      { date: new Date('2023-03-01'), balance: 1400 },
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

    const failedBalances = failedBalancesFinder.findFailedBalances(
      balances,
      movements,
    );
    expect(failedBalances.length).toBe(1);
    expect(failedBalances[0]).toEqual({
      expectedBalance: 1300, // 1100 + 200
      failedBalance: balances[2],
      movementsSum: 200,
      initialBalance: balances[1],
    });
  });
});
