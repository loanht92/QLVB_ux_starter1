import { TestBed } from '@angular/core/testing';

import { DataListService } from './data-list.service';

describe('DataListService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DataListService = TestBed.get(DataListService);
    expect(service).toBeTruthy();
  });
});
