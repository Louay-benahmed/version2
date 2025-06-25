import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoiceManagementbdcComponent } from './invoice-managementbdc.component';

describe('InvoiceManagementbdcComponent', () => {
  let component: InvoiceManagementbdcComponent;
  let fixture: ComponentFixture<InvoiceManagementbdcComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoiceManagementbdcComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvoiceManagementbdcComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
