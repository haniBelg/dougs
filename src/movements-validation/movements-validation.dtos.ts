
import { NoDuplicateMovement, NoFailedBalance, NoUncontrolledMovement } from '@banking/movements-validator';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsNumber, ValidateNested } from 'class-validator';
export class BalanceDto {
  @Type(() => Date)
  @IsDate()
  date: Date;

  @IsNumber()
  balance: number;
}

export class MovementDto {
  @IsNumber()
  id: number;

  @IsNotEmpty()
  wording: string;

  @IsNumber()
  amount: number;

  @Type(() => Date)
  @IsDate()
  date: Date;
}

export class ValidationRequestDto {
  @ValidateNested({ each: true })
  @Type(() => BalanceDto)
  @NoFailedBalance()
  balances: BalanceDto[];

  @ValidateNested({ each: true })
  @Type(() => MovementDto)
  @NoDuplicateMovement()
  @NoUncontrolledMovement()
  movements: MovementDto[];
}
