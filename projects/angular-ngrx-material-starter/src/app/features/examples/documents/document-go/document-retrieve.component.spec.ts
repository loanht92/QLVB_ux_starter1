import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentRetrieveComponent } from './document-retrieve.component';

describe('DocumentRetrieveComponent', () => {
  let component: DocumentRetrieveComponent;
  let fixture: ComponentFixture<DocumentRetrieveComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DocumentRetrieveComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DocumentRetrieveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
