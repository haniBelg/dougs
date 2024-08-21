import { Balance, Movement } from "../../../model/src/bank-operations.models";

export interface BalanceFailure {
  expectedBalance: number;
  movementsSum: number;
  initialBalance: Balance;
  failedBalance: Balance;
}

export interface FailedBalancesFinder {
  // return failed balance with the expected amount and the balance details
  findFailedBalances(
    balances: Balance[],
    movements: Movement[],
  ): BalanceFailure[];
}

export const FailedBalancesFinder = Symbol('FailedBalancesFinder');
