import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentbdcPageComponent } from './paymentbdc-page.component';

describe('PaymentbdcPageComponent', () => {
  let component: PaymentbdcPageComponent;
  let fixture: ComponentFixture<PaymentbdcPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentbdcPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentbdcPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
