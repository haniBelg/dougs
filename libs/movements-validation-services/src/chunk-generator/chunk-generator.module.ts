import { DynamicModule, Module } from '@nestjs/common';
import {
  ChunkGenerator,
  MemoisedChunkGenerator,
} from './chunk-generator.service';
import { ChunkGeneratorImpl } from './chunk-generator.service.impl';
import { MemoisedChunkGeneratorImpl } from './memoized-chunk-generator.service.impl';

@Module({})
export class ChunkGeneratorModule {
  static forRoot(): DynamicModule {
    return {
      module: ChunkGeneratorModule,
      providers: [
        {
          provide: ChunkGenerator,
          useClass: ChunkGeneratorImpl,
        },
        {
          provide: MemoisedChunkGenerator,
          useClass: MemoisedChunkGeneratorImpl,
        },
      ],
      exports: [ChunkGenerator, MemoisedChunkGenerator]
    };
  }
}
