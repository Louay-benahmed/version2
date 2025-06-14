import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportingPageComponent } from './reporting-page.component';

describe('ReportingPageComponent', () => {
  let component: ReportingPageComponent;
  let fixture: ComponentFixture<ReportingPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportingPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
