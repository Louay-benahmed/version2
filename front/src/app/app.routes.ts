import { Routes } from '@angular/router';

import { HomePageComponent } from './components/home-page/home-page.component';
import { LoginPageComponent } from './components/login-page/login-page.component';
import { ReportingPageComponent } from './components/reporting-page/reporting-page.component';
import {SolutionComponent} from './components/solution/solution.component';
import {InvoiceManagementComponent} from './components/invoice-management/invoice-management.component';
import { InvoiceManagementbdcComponent } from './components/invoice-managementbdc/invoice-managementbdc.component'; // Fixed import name
import {FacturePageComponent} from './components/facture-page/facture-page.component';
import {BdcPageComponent} from './components/bdc-page/bdc-page.component';
import { DatabasePageComponent } from './components/database-page/database-page.component';
import { PaymentPageComponent } from './components/payment-page/payment-page.component';
export const routes: Routes = [

  { path: 'solution', component: SolutionComponent },
  { path: 'login-page', component: LoginPageComponent },
  { path: '', redirectTo: 'login-page', pathMatch: 'full' },

  { path: 'home', component: HomePageComponent },
  { path: 'reporting', component: ReportingPageComponent },
  { path: 'management', component: InvoiceManagementComponent },
  { path: 'management bon de commande', component: InvoiceManagementbdcComponent },
  { path: 'facture', component: FacturePageComponent },
  { path: 'bdc', component: BdcPageComponent },
  { path: 'database', component: DatabasePageComponent },
  { path: 'payment', component: PaymentPageComponent }
  /*
      Access the New Page:
      Start the Angular development server (ng serve) and navigate to
      http://localhost:4200/new-page to view your new page.
  */

];
