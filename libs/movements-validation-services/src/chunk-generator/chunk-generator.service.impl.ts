import { Balance, Movement } from '@banking/model';
import { Injectable } from '@nestjs/common';
import { Chunk, ChunkGenerator } from './chunk-generator.service';

interface ChunkDates {
  startBalance: Balance;
  endBalance: Balance;
}

@Injectable()
export class ChunkGeneratorImpl implements ChunkGenerator {
  /**
   * Transforms balances and movements into an array of MovementChunk objects.
   *
   * @param balances - An array of Balance objects representing the points in time where balances are recorded.
   * @param movements - An array of Movement objects representing individual movements with their respective dates.
   * @returns An array of MovementChunk objects, each containing a start and end balance with associated movements.
   */
  transformToChunks(
    balances: Balance[],
    movements: Movement[],
  ): Chunk[] {
    // Compute chunks based on balances
    const chunks: Chunk[] = this.computeChunkDates(balances).map(
      (chunkDates) => ({ ...chunkDates, movements: [] }),
    );

    // If no movements, return chunks with empty movements
    if (movements.length == 0) {
      return chunks;
    }

    // Sort movements by date
    const sortedToBeProcessed: Movement[] = [...movements].sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );

    // Check if all movements are uncontrolled and handle fast-skipping
    const fastSkipChunks = this.allMovementsAreUncontrolled(
      chunks,
      sortedToBeProcessed,
    );

    if (fastSkipChunks) {
      return fastSkipChunks;
    }

    // Main logic for processing movements into chunks
    let currentChunkIndex: number = 0;
    let currentMovement: Movement = sortedToBeProcessed[0];
    let uncontrolledMovementAtFirst: Movement[] = [];

    while (currentMovement && currentChunkIndex < chunks.length) {
      const currentChunk = chunks[currentChunkIndex];
      const chunkStartTime =
        currentChunk?.startBalance?.date?.getTime() ?? -Infinity;
      const chunkEndTime =
        currentChunk?.endBalance?.date?.getTime() ?? Infinity;

      const movementTime = currentMovement?.date?.getTime() ?? -Infinity;

      if (movementTime < chunkStartTime) {
        // Movement is before the chunk's start balance
        // Add movement to uncontrolled movements and move to next movement
        uncontrolledMovementAtFirst.push(sortedToBeProcessed.shift());
        currentMovement = sortedToBeProcessed[0];
        continue;
      }

      if (movementTime >= chunkStartTime && movementTime < chunkEndTime) {
        // Movement is within the chunk's date range
        // Add movement to the current chunk and move to next movement
        currentChunk.movements.push(sortedToBeProcessed.shift());
        currentMovement = sortedToBeProcessed[0];
        continue;
      }

      if (movementTime > chunkEndTime) {
        // Move to the next chunk if the movement date is beyond the current chunk's end balance
        currentChunkIndex++;
      }
    }

    // Handle movements that were uncontrolled at the beginning
    if (uncontrolledMovementAtFirst.length > 0) {
      chunks.unshift({
        startBalance: null,
        endBalance: chunks[0]?.startBalance ?? null,
        movements: uncontrolledMovementAtFirst,
      });
    }

    // Handle remaining movements that are uncontrolled at the end
    if (sortedToBeProcessed.length > 0) {
      chunks.push({
        startBalance: chunks[chunks.length - 1]?.endBalance ?? null,
        endBalance: null,
        movements: sortedToBeProcessed,
      });
    }

    return chunks;
  }

  /**
   * Determines if all movements are uncontrolled at the first or last chunk and handles fast-skipping.
   *
   * @param chunks - An array of MovementChunk objects.
   * @param sortedToBeProcessed - An array of sorted Movement objects to be processed.
   * @returns An array of MovementChunk objects with movements if all are uncontrolled, otherwise null.
   */
  private allMovementsAreUncontrolled(
    chunks: Chunk[],
    sortedToBeProcessed: Movement[],
  ): Chunk[] {
    const fastSkipChunks = [...chunks];
    const firstChunk = chunks[0];
    const firstStartBalanceTime =
      firstChunk?.startBalance?.date?.getTime() ?? -Infinity;

    const lastMovement = sortedToBeProcessed[sortedToBeProcessed.length - 1];
    const lastMovementTime = lastMovement?.date?.getTime() ?? +Infinity;

    // Fast skip if all movements are before the first balance
    if (lastMovementTime < firstStartBalanceTime) {
      fastSkipChunks.unshift({
        startBalance: null,
        endBalance: firstChunk?.startBalance ?? null,
        movements: sortedToBeProcessed,
      });
      return fastSkipChunks;
    }

    const lastChunk = chunks[chunks.length - 1];
    const lastEndBalanceTime =
      lastChunk?.endBalance?.date?.getTime() ?? Infinity;
    const firstMovement = sortedToBeProcessed[0];
    const firstMovementTime = firstMovement?.date?.getTime() ?? -Infinity;

    // Fast skip if all movements are after the last balance
    if (firstMovementTime > lastEndBalanceTime) {
      fastSkipChunks.push({
        startBalance: lastChunk?.endBalance ?? null,
        endBalance: null,
        movements: sortedToBeProcessed,
      });
      return fastSkipChunks;
    }

    return null;
  }

  /**
   * Computes the start and end dates for chunks based on balances.
   *
   * @param balances - An array of Balance objects to be used for chunk boundaries.
   * @returns An array of ChunkDates objects representing the start and end dates for each chunk.
   */
  private computeChunkDates(balances: Balance[]): ChunkDates[] {
    // Sort balances by date
    const sortedBalances: Balance[] = [...balances].sort(
      (a, b) => a.date?.getTime() - b.date?.getTime(),
    );
    const chunks: ChunkDates[] = [];
    let startBalance = sortedBalances.shift();

    // Create chunks based on sorted balances
    while (startBalance) {
      const endBalance = sortedBalances.shift() ?? null;
      if (endBalance || chunks.length == 0) {
        const chunkDates = {
          startBalance,
          endBalance,
        };
        chunks.push(chunkDates);
      }
      startBalance = endBalance;
    }
    return chunks;
  }
}
