import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentGoComponent } from './document-go.component';

describe('DocumentGoComponent', () => {
  let component: DocumentGoComponent;
  let fixture: ComponentFixture<DocumentGoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DocumentGoComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DocumentGoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
