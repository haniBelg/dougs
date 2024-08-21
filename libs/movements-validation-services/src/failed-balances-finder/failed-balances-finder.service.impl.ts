import { Balance, Movement } from '@banking/model';
import { Inject } from '@nestjs/common';
import { Chunk, ChunkGenerator, MemoisedChunkGenerator } from '../chunk-generator/chunk-generator.service';
import {
  BalanceFailure,
  FailedBalancesFinder,
} from './failed-balances-finder.service';

export class FailedBalancesFinderImpl implements FailedBalancesFinder {
  constructor(
    @Inject(MemoisedChunkGenerator)
    private chunkGenerator: ChunkGenerator,
  ) {}
  // Method to check if the sum of movement amounts plus start balance balance differs from the end balance balance
  findFailedBalances(
    balances: Balance[],
    movements: Movement[],
  ): BalanceFailure[] {
    return this.chunkGenerator
      .transformToChunks(balances, movements)
      .filter((movementChunk) =>
        this.chunkHaveInvalidBalance(movementChunk),
      )
      .map(
        (movementChunk) =>
          ({
            expectedBalance: this.chunkExpectedBalance(movementChunk),
            failedBalance: movementChunk.endBalance,
            movementsSum: this.chunkMovementsSum(movementChunk),
            initialBalance: movementChunk.startBalance,
          }) as BalanceFailure,
      );
  }
  private chunkHaveInvalidBalance(movementChunk: Chunk): boolean {
    if (!this.chunkVerifiable(movementChunk)) {
      return false;
    }
    const expectedEndBalance = this.chunkExpectedBalance(movementChunk);
    return expectedEndBalance !== movementChunk.endBalance.balance;
  }

  private chunkVerifiable(movementChunk: Chunk): boolean {
    return (
      !!movementChunk.startBalance && !!movementChunk.endBalance
    );
  }

  private chunkExpectedBalance(movementChunk: Chunk): number {
    const sumOfMovements = this.chunkMovementsSum(movementChunk);
    return movementChunk.startBalance.balance + sumOfMovements;
  }

  private chunkMovementsSum(movementChunk: Chunk): number {
    return this.movementsSum(movementChunk.movements);
  }

  private movementsSum(movements: Movement[]): number {
    return movements.reduce(
      (sum, movement) => sum + movement.amount,
      0,
    );
  }
}
