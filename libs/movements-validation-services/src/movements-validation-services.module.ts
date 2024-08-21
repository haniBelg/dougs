import { Module } from '@nestjs/common';
import { ChunkGeneratorModule } from './chunk-generator/chunk-generator.module';
import { DuplicateMovementsFinder } from './duplicate-movements-finder/duplicate-movements-finder.service';
import { DuplicateMovementsFinderImpl } from './duplicate-movements-finder/duplicate-movements-finder.service.impl';
import { FailedBalancesFinder } from './failed-balances-finder/failed-balances-finder.service';
import { FailedBalancesFinderImpl } from './failed-balances-finder/failed-balances-finder.service.impl';
import { UncontrolledMovementsFinder } from './uncontrolled-movements-finder/uncontrolled-movements-finder.service';
import { UncontrolledMovementsFinderImpl } from './uncontrolled-movements-finder/uncontrolled-movements-finder.service.impl';

@Module({
  imports: [ChunkGeneratorModule.forRoot()],
  providers: [{
    provide: FailedBalancesFinder,
    useClass: FailedBalancesFinderImpl,
  },
  {
    provide: DuplicateMovementsFinder,
    useClass: DuplicateMovementsFinderImpl,
  },
  {
    provide: UncontrolledMovementsFinder,
    useClass: UncontrolledMovementsFinderImpl,
  },
  ],
  exports: [UncontrolledMovementsFinder, DuplicateMovementsFinder, FailedBalancesFinder],
})
export class MovementsValidationServicesModule {
}
