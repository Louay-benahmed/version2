import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BdcPageComponent } from './bdc-page.component';

describe('BdcPageComponent', () => {
  let component: BdcPageComponent;
  let fixture: ComponentFixture<BdcPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BdcPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BdcPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
