import { Balance, Movement } from '@banking/model';
import { Inject, Injectable } from '@nestjs/common';
import { memoize } from 'utils-decorators';
import { Chunk, ChunkGenerator } from './chunk-generator.service';

@Injectable()
export class MemoisedChunkGeneratorImpl implements ChunkGenerator {
  constructor(
    @Inject(ChunkGenerator) private chunkChunkGenerator: ChunkGenerator,
  ) {}
  /**
   * Transforms balances and movements into an array of MovementChunk objects.
   *
   * @param balances - An array of Balance objects representing the points in time where balances are recorded.
   * @param movements - An array of Movement objects representing individual movements with their respective dates.
   * @returns An array of MovementChunk objects, each containing a start and end balance with associated movements.
   */
  @memoize()
  transformToChunks(
    balances: Balance[],
    movements: Movement[],
  ): Chunk[] {
    return this.chunkChunkGenerator.transformToChunks(
      balances,
      movements,
    );
  }
}
