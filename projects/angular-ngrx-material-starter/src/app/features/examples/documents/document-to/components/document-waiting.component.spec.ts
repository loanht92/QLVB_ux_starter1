import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentWaitingComponent } from './document-waiting.component';

describe('DocumentWaitingComponent', () => {
  let component: DocumentWaitingComponent;
  let fixture: ComponentFixture<DocumentWaitingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DocumentWaitingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DocumentWaitingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
