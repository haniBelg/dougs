import { Balance, Movement } from '@banking/model';

import { Inject } from '@nestjs/common';
import { Chunk, ChunkGenerator, MemoisedChunkGenerator } from '../chunk-generator/chunk-generator.service';
import { UncontrolledMovementsFinder } from './uncontrolled-movements-finder.service';

export class UncontrolledMovementsFinderImpl
  implements UncontrolledMovementsFinder
{
  constructor(
    @Inject(MemoisedChunkGenerator)
    private chunkGenerator: ChunkGenerator,
  ) {}

  // Method to check for uncontrolled movements (missing start or end balance)
  findUncontrolledMovements(
    balances: Balance[],
    movements: Movement[],
  ): Movement[] {
    const chunks: Chunk[] = this.chunkGenerator.transformToChunks(
      balances,
      movements,
    );
    return chunks
      .filter((movementChunk) =>
        this.chunkHaveUncontrolledMovements(movementChunk),
      )
      .flatMap((movementChunk) => movementChunk.movements);
  }

  private chunkHaveUncontrolledMovements(movementChunk): boolean {
    return !movementChunk.startBalance || !movementChunk.endBalance;
  }
}
