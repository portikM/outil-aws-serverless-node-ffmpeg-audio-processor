import { Test, TestingModule } from '@nestjs/testing';
import { ConcatService } from './concat.service';

describe('ConcatService', () => {
  let service: ConcatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConcatService],
    }).compile();

    service = module.get<ConcatService>(ConcatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
