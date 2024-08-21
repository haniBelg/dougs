import { Movement } from '@banking/model';
import { Injectable } from '@nestjs/common';
import { DuplicateMovementsFinder } from './duplicate-movements-finder.service';

@Injectable()
export class DuplicateMovementsFinderImpl
  implements DuplicateMovementsFinder
{
  // Method to check for duplicate movements in a movements
  findDuplicateMovements(movements: Movement[]): Movement[] {
    const duplicates: Movement[] = [];
    const movementIds = new Set<number>();
    for (const movement of movements) {
      if (movementIds.has(movement.id)) {
        duplicates.push(movement); // Duplicate found
      } else {
        movementIds.add(movement.id);
      }
    }
    return duplicates;
  }
}
