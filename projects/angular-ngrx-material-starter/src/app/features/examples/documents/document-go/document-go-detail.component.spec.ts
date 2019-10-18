import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentGoDetailComponent } from './document-go-detail.component';

describe('DocumentGoDetailComponent', () => {
  let component: DocumentGoDetailComponent;
  let fixture: ComponentFixture<DocumentGoDetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DocumentGoDetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DocumentGoDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
