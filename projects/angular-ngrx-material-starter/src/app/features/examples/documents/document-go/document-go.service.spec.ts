import { TestBed } from '@angular/core/testing';

import { DocumentGoService } from './document-go.service';

describe('DocumentGoService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DocumentGoService = TestBed.get(DocumentGoService);
    expect(service).toBeTruthy();
  });
});
