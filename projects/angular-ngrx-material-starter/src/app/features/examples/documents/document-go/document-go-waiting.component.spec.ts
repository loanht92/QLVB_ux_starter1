import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentGoWaitingComponent } from './document-go-waiting.component';

describe('DocumentGoWaitingComponent', () => {
  let component: DocumentGoWaitingComponent;
  let fixture: ComponentFixture<DocumentGoWaitingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DocumentGoWaitingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DocumentGoWaitingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
