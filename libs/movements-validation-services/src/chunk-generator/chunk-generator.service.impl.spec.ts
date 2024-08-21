import { Balance, Movement } from '@banking/model';
import { Test, TestingModule } from '@nestjs/testing';
import { Chunk, ChunkGenerator } from './chunk-generator.service';
import { ChunkGeneratorImpl } from './chunk-generator.service.impl';

describe('transformToChunks()', () => {
  let generator: ChunkGenerator;
  const _balances: Balance[] = [
    {
      date: new Date('2023-01-01'),
      balance: 0,
    },
    {
      date: new Date('2023-02-01'),
      balance: 10,
    },
    {
      date: new Date('2023-03-01'),
      balance: 30,
    },
    {
      date: new Date('2023-04-01'),
      balance: 60,
    },
  ];
  const _movements: Movement[] = [
    {
      date: new Date('2023-01-05'),
      id: 1,
      wording: 'Movement - 1',
      amount: 10,
    },
    {
      date: new Date('2023-02-05'),
      id: 2,
      wording: 'Movement - 2',
      amount: 20,
    },
    {
      date: new Date('2023-03-05'),
      id: 3,
      wording: 'Movement - 3',
      amount: 30,
    },
  ];
  const _chunks: Chunk[] = [
    {
      startBalance: _balances[0],
      endBalance: _balances[1],
      movements: [_movements[0]],
    },
    {
      startBalance: _balances[1],
      endBalance: _balances[2],
      movements: [_movements[1]],
    },
    {
      startBalance: _balances[2],
      endBalance: _balances[3],
      movements: [_movements[2]],
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ChunkGenerator,
          useClass: ChunkGeneratorImpl,
        },
      ],
    }).compile();

    generator = module.get<ChunkGenerator>(ChunkGenerator);
  });

  it('should return an empty array when no balances and no movements are provided', () => {
    //given
    const balances: Balance[] = [];
    const movements: Movement[] = [];

    //when
    const result = generator.transformToChunks(balances, movements);

    //then
    expect(result).toEqual([]);
  });

  it('should return chunks with empty movements when balances are provided but no movements', () => {
    //given
    const balances: Balance[] = [..._balances];
    const movements: Movement[] = [];
    const chunks: Chunk[] = [
      ..._chunks.map((chunk) => ({ ...chunk, movements: [] })),
    ];

    //when
    const result = generator.transformToChunks(balances, movements);

    //then
    expect(result).toEqual(chunks);
  });

  it('should correctly distribute movements into chunks based on balance dates', () => {
    //given
    const balances: Balance[] = [..._balances];
    const movements: Movement[] = [
      ..._movements,
      {
        date: new Date('2023-01-05'),
        id: 4,
        wording: 'Movement - 4',
        amount: 30,
      },
    ];
    const chunks: Chunk[] = [
      {
        ..._chunks[0],
        movements: [..._chunks[0].movements, movements[3]],
      },
      { ..._chunks[1] },
      { ..._chunks[2] },
    ];

    //when
    const result = generator.transformToChunks(balances, movements);

    //then
    expect(result).toEqual(chunks);
  });

  it('should handle movements occurring before the first balance as uncontrolled', () => {
    //given
    const balances: Balance[] = [..._balances];
    const movements: Movement[] = [
      ..._movements,
      {
        date: new Date('2022-01-05'),
        id: 4,
        wording: 'Movement - 4',
        amount: 30,
      },
    ];
    const chunks: Chunk[] = [
      {
        startBalance: null,
        endBalance: balances[0],
        movements: [movements[3]],
      },
      ..._chunks,
    ];

    //when
    const result = generator.transformToChunks(balances, movements);

    //then
    expect(result).toEqual(chunks);
  });

  it('should handle movements occurring after the last balance as uncontrolled', () => {
    //given
    const balances: Balance[] = [..._balances];
    const movements: Movement[] = [
      ..._movements,
      {
        date: new Date('2024-01-05'),
        id: 4,
        wording: 'Movement - 4',
        amount: 30,
      },
    ];
    const chunks: Chunk[] = [
      ..._chunks,
      {
        startBalance: balances[3],
        endBalance: null,
        movements: [movements[3]],
      },
    ];

    //when
    const result = generator.transformToChunks(balances, movements);

    //then
    expect(result).toEqual(chunks);
  });

  it('should handle the case where all movements are uncontrolled at first', () => {
    //given
    const balances: Balance[] = [..._balances];
    const movements: Movement[] = [
      { ..._movements[0], date: new Date('2022-01-05') },
      { ..._movements[1], date: new Date('2022-02-05') },
      { ..._movements[2], date: new Date('2022-03-05') },
    ];
    const chunks: Chunk[] = [
      {
        startBalance: null,
        endBalance: balances[0],
        movements,
      },
      ..._chunks.map((chunk) => ({ ...chunk, movements: [] })),
    ];

    //when
    const result = generator.transformToChunks(balances, movements);

    //then
    expect(result).toEqual(chunks);
  });

  it('should handle the case where all movements are uncontrolled at last', () => {
    //given
    const balances: Balance[] = [..._balances];
    const movements: Movement[] = [
      { ..._movements[0], date: new Date('2024-01-05') },
      { ..._movements[1], date: new Date('2024-02-05') },
      { ..._movements[2], date: new Date('2024-03-05') },
    ];
    const chunks: Chunk[] = [
      ..._chunks.map((chunk) => ({ ...chunk, movements: [] })),
      {
        startBalance: balances[3],
        endBalance: null,
        movements,
      },
    ];

    //when
    const result = generator.transformToChunks(balances, movements);

    //then
    expect(result).toEqual(chunks);
  });

  it('should handle the case where only balances are provided without any movements', () => {
    //given
    const balances: Balance[] = [..._balances];
    const chunks: Chunk[] = [
      ..._chunks.map((chunk) => ({ ...chunk, movements: [] })),
    ];
    const movements: Movement[] = [];

    //when
    const result = generator.transformToChunks(balances, movements);

    //then
    expect(result).toEqual(chunks);
  });

  it('should handle the case where only movements are provided without any balances', () => {
    //given
    const balances: Balance[] = [];
    const movements: Movement[] = [..._movements];
    const chunks: Chunk[] = [
      {
        endBalance: null,
        startBalance: null,
        movements,
      },
    ];
    //when
    const result = generator.transformToChunks(balances, movements);
    //then
    expect(result).toEqual(chunks);
  });

  // following tests aim is to test if nulls werer passed no NPE is raised
  // testing the robustness of our service
  it('should handle startBalance date being null, resulting in -Infinity for chunk start time', () => {
    const balances: Balance[] = [
      { balance: 1, date: null }, // startBalance date is null
      { balance: 2, date: new Date('2023-01-01') },
    ];
    const movements: Movement[] = [
      {
        id: 1,
        date: new Date('2022-12-31'),
        wording: '',
        amount: 0,
      },
    ];

    const chunks = generator.transformToChunks(balances, movements);

    expect(chunks).toHaveLength(1);
    expect(chunks[0].startBalance).toEqual({ balance: 1, date: null });
    expect(chunks[0].movements).toHaveLength(1);
    expect(chunks[0].movements[0].id).toBe(1);
  });

  it('should handle movement date being null, resulting in -Infinity for movement time', () => {
    const balances: Balance[] = [
      { balance: 1, date: new Date('2023-01-01') },
    ];
    const movements: Movement[] = [
      {
        id: 1,
        date: null,
        wording: '',
        amount: 0,
      }, // movement date is null
    ];

    const chunks = generator.transformToChunks(balances, movements);

    expect(chunks).toHaveLength(2);
    expect(chunks[0].movements).toHaveLength(1);
    expect(chunks[0].movements[0].id).toBe(1);
  });

  it('should handle null endBalance on the first chunk', () => {
    const balances: Balance[] = [
      { balance: 1, date: new Date('2023-01-01') },
    ];
    const movements: Movement[] = [
      {
        id: 1,
        date: new Date('2023-01-02'),
        wording: '',
        amount: 0,
      },
    ];

    const chunks = generator.transformToChunks(balances, movements);

    expect(chunks).toHaveLength(1);
    expect(chunks[0].endBalance).toBeNull(); // The null part for endBalance
    expect(chunks[0].movements).toHaveLength(1);
    expect(chunks[0].startBalance).toEqual({
      balance: 1,
      date: new Date('2023-01-01'),
    });
  });

  it('should handle lastMovement date being null, resulting in +Infinity for movement time', () => {
    const balances: Balance[] = [
      { balance: 1, date: new Date('2023-01-01') },
    ];
    const movements: Movement[] = [
      {
        id: 1,
        date: null,
        wording: '',
        amount: 0,
      }, // lastMovement date is null, should result in +Infinity comparison
    ];

    const chunks = generator.transformToChunks(balances, movements);

    expect(chunks).toHaveLength(2);
    expect(chunks[0].movements).toHaveLength(1);
    expect(chunks[0].movements[0].id).toBe(1);
    expect(chunks[1].movements).toHaveLength(0);
  });

  it('should handle firstChunk with null startBalance', () => {
    const balances: Balance[] = [
      { balance: 1, date: new Date('2023-01-01') },
    ];
    const movements: Movement[] = [
      {
        id: 1,
        date: new Date('2022-12-31'),
        wording: '',
        amount: 0,
      },
    ];

    const chunks = generator.transformToChunks(balances, movements);

    expect(chunks).toHaveLength(2);
    expect(chunks[0].startBalance).toBeNull(); // The null part for startBalance
    expect(chunks[0].movements).toHaveLength(1);
    expect(chunks[0].movements[0].id).toBe(1);
  });

  it('should handle firstMovement date being null, resulting in -Infinity for firstMovement time', () => {
    const balances: Balance[] = [
      { balance: 1, date: new Date('2023-01-01') },
    ];
    const movements: Movement[] = [
      {
        id: 1,
        date: null,
        wording: '',
        amount: 0,
      }, // firstMovement date is null, should result in -Infinity comparison
    ];

    const chunks = generator.transformToChunks(balances, movements);

    expect(chunks).toHaveLength(2);
    expect(chunks[0].startBalance).toBeNull();
    expect(chunks[0].endBalance).toEqual(balances[0]);
    expect(chunks[0].movements).toHaveLength(1);
    expect(chunks[0].movements[0].id).toBe(1);

    expect(chunks[1].startBalance).toEqual(balances[0]);
    expect(chunks[1].endBalance).toBeNull();
    expect(chunks[1].movements).toHaveLength(0);
  });

  it('should handle lastChunk with null endBalance', () => {
    const balances: Balance[] = [
      { balance: 1, date: new Date('2023-01-01') },
    ];
    const movements: Movement[] = [
      {
        id: 1, date: new Date('2023-01-02'),
        wording: '',
        amount: 0
      },
    ];

    const chunks = generator.transformToChunks(balances, movements);

    expect(chunks).toHaveLength(1);
    expect(chunks[0].endBalance).toBeNull(); // The null part for endBalance
    expect(chunks[0].movements).toHaveLength(1);
    expect(chunks[0].movements[0].id).toBe(1);
  });
});
