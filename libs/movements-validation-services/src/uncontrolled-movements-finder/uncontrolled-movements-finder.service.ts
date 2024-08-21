import {
  Balance,
  Movement,
} from '@banking/model';

export interface UncontrolledMovementsFinder {
  // return movement that were not delimeted by balances
  findUncontrolledMovements(
    balances: Balance[],
    movements: Movement[],
  ): Movement[];
}

export const UncontrolledMovementsFinder = Symbol(
  'UncontrolledMovementsFinder',
);
