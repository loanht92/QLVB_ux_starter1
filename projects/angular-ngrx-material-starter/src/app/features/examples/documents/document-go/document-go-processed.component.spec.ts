import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentGoProcessedComponent } from './document-go-processed.component';

describe('DocumentGoProcessedComponent', () => {
  let component: DocumentGoProcessedComponent;
  let fixture: ComponentFixture<DocumentGoProcessedComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DocumentGoProcessedComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DocumentGoProcessedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
