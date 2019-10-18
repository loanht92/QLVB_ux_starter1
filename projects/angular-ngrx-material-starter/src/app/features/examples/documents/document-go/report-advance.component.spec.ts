import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportAdvanceComponent } from './report-advance.component';

describe('ReportAdvanceComponent', () => {
  let component: ReportAdvanceComponent;
  let fixture: ComponentFixture<ReportAdvanceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReportAdvanceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReportAdvanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
