import { TestBed } from '@angular/core/testing';

import { IncomingDocService } from './incoming-doc.service';

describe('IncomingDocService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: IncomingDocService = TestBed.get(IncomingDocService);
    expect(service).toBeTruthy();
  });
});
