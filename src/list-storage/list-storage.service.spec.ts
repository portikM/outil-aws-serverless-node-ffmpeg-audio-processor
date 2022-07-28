import { Test, TestingModule } from '@nestjs/testing';
import { ListStorageService } from './list-storage.service';

describe('ListStorageService', () => {
  let service: ListStorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ListStorageService],
    }).compile();

    service = module.get<ListStorageService>(ListStorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
