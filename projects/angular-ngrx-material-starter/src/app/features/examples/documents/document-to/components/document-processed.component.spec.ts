import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentProcessedComponent } from './document-processed.component';

describe('DocumentProcessedComponent', () => {
  let component: DocumentProcessedComponent;
  let fixture: ComponentFixture<DocumentProcessedComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DocumentProcessedComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DocumentProcessedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
