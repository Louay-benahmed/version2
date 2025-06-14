import { Routes } from '@angular/router';

import { HomePageComponent } from './components/home-page/home-page.component';
import { LoginPageComponent } from './components/login-page/login-page.component';
import { ReportingPageComponent } from './components/reporting-page/reporting-page.component';
import {SolutionComponent} from './components/solution/solution.component';
import {InvoiceManagementComponent} from './components/invoice-management/invoice-management.component';

export const routes: Routes = [

  { path: 'solution', component: SolutionComponent },
  { path: 'login-page', component: LoginPageComponent },
  { path: '', redirectTo: 'login-page', pathMatch: 'full' },

  { path: 'home', component: HomePageComponent },
  { path: 'reporting', component: ReportingPageComponent },
  { path: 'management', component: InvoiceManagementComponent },

  /*
      Access the New Page:
      Start the Angular development server (ng serve) and navigate to
      http://localhost:4200/new-page to view your new page.
  */

];
