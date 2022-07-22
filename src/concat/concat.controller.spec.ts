import { Test, TestingModule } from '@nestjs/testing';
import { ConcatController } from './concat.controller';

describe('ConcatController', () => {
  let controller: ConcatController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConcatController],
    }).compile();

    controller = module.get<ConcatController>(ConcatController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
