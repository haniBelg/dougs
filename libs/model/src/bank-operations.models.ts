export interface Balance {
  date: Date;
  balance: number;
}
export interface Movement {
  id: number;
  wording: string;
  amount: number;
  date: Date;
}