import { Balance, Movement } from '@banking/model';
import { Test, TestingModule } from '@nestjs/testing';
import { Chunk, ChunkGenerator } from './chunk-generator.service';
import { MemoisedChunkGeneratorImpl } from './memoized-chunk-generator.service.impl';

// Mock the ChunkGenerator
let mockChunkGenerator: jest.Mocked<ChunkGenerator>;

describe('MemoisedChunkGeneratorImpl', () => {
  let service: MemoisedChunkGeneratorImpl;

  beforeEach(async () => {
    // Create a mock instance of ChunkGenerator using jest.fn()
    mockChunkGenerator = {
      transformToChunks: jest.fn(),
    } as any;
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: ChunkGenerator, useValue: mockChunkGenerator },
        MemoisedChunkGeneratorImpl,
      ],
    }).compile();

    service = module.get<MemoisedChunkGeneratorImpl>(
      MemoisedChunkGeneratorImpl,
    );
  });

  it('should memoize the result of transformToChunks', async () => {
    const balances: Balance[] = [
      /* some test data */
    ];
    const movements: Movement[] = [
      /* some test data */
    ];
    const expectedChunks: Chunk[] = [
      /* some expected chunks */
    ];

    // Set up the mock to return a specific result
    mockChunkGenerator.transformToChunks.mockReturnValue(expectedChunks);

    // Call the method once
    const result1 = service.transformToChunks(balances, movements);
    expect(result1).toEqual(expectedChunks);

    // Call the method again with the same arguments
    const result2 = service.transformToChunks(balances, movements);
    expect(result2).toEqual(expectedChunks);

    // Ensure the method on the mock is only called once
    expect(mockChunkGenerator.transformToChunks).toHaveBeenCalledTimes(1);
  });
});
