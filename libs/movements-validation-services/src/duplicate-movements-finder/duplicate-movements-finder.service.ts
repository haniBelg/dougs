import { Movement } from '@banking/model';

export interface DuplicateMovementsFinder {
  // return duplicated movements with same id
  findDuplicateMovements(movements: Movement[]): Movement[];
}

export const DuplicateMovementsFinder = Symbol('DuplicateMovementsFinder');
