import { TestBed } from '@angular/core/testing';

import { SPAPICommonService } from './spapicommon.service';

describe('SPAPICommonService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SPAPICommonService = TestBed.get(SPAPICommonService);
    expect(service).toBeTruthy();
  });
});
