import { Balance, Movement } from '@banking/model';

export interface Chunk {
  startBalance?: Balance;
  endBalance?: Balance;
  movements?: Movement[];
}

export interface ChunkGenerator {
  transformToChunks(
    balances: Balance[],
    movements: Movement[],
  ): Chunk[];
}

export const ChunkGenerator = Symbol('ChunkGenerator');
export const MemoisedChunkGenerator = Symbol('MemoisedChunkGenerator');
