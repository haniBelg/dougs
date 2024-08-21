import { MovementsValidatorModule } from '@banking/movements-validator';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationController } from './movements-validation.controller';

describe('ValidationController', () => {
  let controller: ValidationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [MovementsValidatorModule],
      controllers: [ValidationController],
    }).compile();

    controller = module.get<ValidationController>(ValidationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
