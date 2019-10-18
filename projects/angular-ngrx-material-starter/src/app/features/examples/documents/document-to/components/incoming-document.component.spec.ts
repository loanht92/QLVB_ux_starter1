import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IncomingDocumentComponent } from './incoming-document.component';

describe('IncomingDocumentComponent', () => {
  let component: IncomingDocumentComponent;
  let fixture: ComponentFixture<IncomingDocumentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ IncomingDocumentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IncomingDocumentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
