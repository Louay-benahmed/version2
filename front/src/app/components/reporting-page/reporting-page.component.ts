import {Component, OnInit} from '@angular/core';
import {NgIf, CommonModule} from '@angular/common';
import {Router} from '@angular/router';

import { SupplierService } from '../../supplier.service';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';

import { Chart, registerables } from 'chart.js';
import {FormsModule} from '@angular/forms';
Chart.register(...registerables);

@Component({
  selector: 'app-reporting-page',
  standalone: true,
  imports: [
    NgIf,
    FormsModule,
    CommonModule
  ],
  templateUrl: './reporting-page.component.html',
  styleUrl: './reporting-page.component.css'
})
export class ReportingPageComponent implements OnInit {
  paidFactures: any[] = [];
  unpaidFactures: any[] = [];
  isLoading = true;
  showOtherDiv: boolean = false;
  showCalendarDiv: boolean = false;
  showCalendarClientsDiv: boolean = false;
  pdfSrc: SafeResourceUrl | null = null;
  paidBonDeCommandes: any[] = [];
  unpaidBonDeCommandes: any[] = [];
  sendingBonDeCommandeEmails: {[key: number]: boolean} = {};

  updatingPayment: {[key: number]: boolean} = {};
  updatingBonDeCommandePayment: {[key: number]: boolean} = {};
  deletingFacture: {[key: number]: boolean} = {};
  deletingBonDeCommande: {[key: number]: boolean} = {};

  private paymentChart: Chart | null = null;
  private donutChart: Chart | null = null;


  // Add these properties to your component class
  selectedYear: number = new Date().getFullYear();
  availableYears: number[] = [];
  originalPaidFactures: any[] = [];
  originalUnpaidFactures: any[] = [];
  originalPaidBonDeCommandes: any[] = [];
  originalUnpaidBonDeCommandes: any[] = [];





  constructor(
    private router: Router,
    private supplierService: SupplierService,
    private sanitizer: DomSanitizer
  ) {
  }

  // Modify your ngOnInit to initialize years
  ngOnInit(): void {
    this.initializeAvailableYears();
    this.loadFactures();
    this.loadBonDeCommandes();
  }

  initializeAvailableYears(): void {
    const currentYear = new Date().getFullYear();
    this.availableYears = Array.from(
      { length: currentYear },
      (_, index) => currentYear - index
    );
    this.selectedYear = currentYear;
  }

// Add this method to your component
// Update your logDocumentDates method
  logDocumentDates(): void {
    console.group('Document Date Verification');

    console.log('=== Paid Factures ===');
    this.originalPaidFactures.forEach(f => {
      const date = new Date(f.dateCreation);
      console.log(`ID: ${f.facture_id}`, {
        rawDate: f.dateCreation,
        parsedDate: date,
        year: date.getUTCFullYear(),
        month: date.getUTCMonth() + 1,
        day: date.getUTCDate()
      });
    });

    console.log('=== Unpaid Factures ===');
    this.originalUnpaidFactures.forEach(f => {
      const date = new Date(f.dateCreation);
      console.log(`ID: ${f.facture_id}`, {
        rawDate: f.dateCreation,
        parsedDate: date,
        year: date.getUTCFullYear()
      });
    });

    console.log('=== Paid BonDeCommandes ===');
    this.originalPaidBonDeCommandes.forEach(b => {
      const date = new Date(b.dateCreation);
      console.log(`ID: ${b.id}`, {
        rawDate: b.dateCreation,
        parsedDate: date,
        year: date.getUTCFullYear()
      });
    });

    console.log('=== Unpaid BonDeCommandes ===');
    this.originalUnpaidBonDeCommandes.forEach(b => {
      const date = new Date(b.dateCreation);
      console.log(`ID: ${b.id}`, {
        rawDate: b.dateCreation,
        parsedDate: date,
        year: date.getUTCFullYear()
      });
    });

    console.groupEnd();
  }
  // Modify your load methods to store original data
  loadFactures(): void {
    this.supplierService.getAllFactures().subscribe({
      next: (factures) => {
        this.originalPaidFactures = factures.filter((f: any) => f.payment);
        this.originalUnpaidFactures = factures.filter((f: any) => !f.payment);
        this.logDocumentDates(); // <-- Add this

        this.filterByYear();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading factures:', err);
        this.isLoading = false;
      }
    });
  }

  loadBonDeCommandes(): void {
    this.supplierService.getAllBonDeCommandes().subscribe({
      next: (commandes) => {
        this.originalPaidBonDeCommandes = commandes.filter((c: any) => c.payment);
        this.originalUnpaidBonDeCommandes = commandes.filter((c: any) => !c.payment);
        this.filterByYear();
      },
      error: (err) => {
        console.error('Error loading bon de commandes:', err);
      }
    });
  }

// Add these new methods for year filtering
// In reporting-page.component.ts
  filterByYear(): void {
    if (!this.selectedYear) return;

    const targetYear = Number(this.selectedYear);
    console.log(`Filtering for year: ${targetYear}`);

    // Improved date filtering that handles timezones
    const filterByYear = (items: any[]): any[] => {
      return items.filter(item => {
        if (!item.dateCreation) return false;

        // Handle both string and Date objects
        const date = new Date(item.dateCreation);
        return date.getUTCFullYear() === targetYear; // Use UTC to avoid timezone issues
      });
    };

    this.paidFactures = filterByYear(this.originalPaidFactures);
    this.unpaidFactures = filterByYear(this.originalUnpaidFactures);
    this.paidBonDeCommandes = filterByYear(this.originalPaidBonDeCommandes);
    this.unpaidBonDeCommandes = filterByYear(this.originalUnpaidBonDeCommandes);

    console.log('Filtered counts:', {
      paidFactures: this.paidFactures.length,
      unpaidFactures: this.unpaidFactures.length,
      paidBonDeCommandes: this.paidBonDeCommandes.length,
      unpaidBonDeCommandes: this.unpaidBonDeCommandes.length
    });

    this.createPaymentChart(true);
    this.createDonutChart(true);
  }
  resetYearFilter(): void {
    this.selectedYear = new Date().getFullYear(); // Reset to current year
    this.filterByYear();
  }


  goToPage(): void {
    const newTab = window.open('/home', '_blank');
    if (newTab) {
      window.close(); // Tries to close the current tab
    }
  }


  goToPageManagement(): void {
    this.router.navigate(['/management']);
  }




  // Modified to accept force recreation parameter
  createPaymentChart(forceRecreate: boolean = false): void {
    const ctx = document.getElementById('paymentChart') as HTMLCanvasElement;
    if (!ctx) return;

    // Destroy existing chart if it exists or if forced
    if (this.paymentChart || forceRecreate) {
      this.paymentChart?.destroy();
    }

    this.paymentChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Factures', 'Bons de commande'],
        datasets: [
          {
            label: 'Payé',
            data: [this.paidFactures.length, this.paidBonDeCommandes.length],
            backgroundColor: '#4CAF50',
            stack: 'Stack 0'
          },
          {
            label: 'Non payé',
            data: [this.unpaidFactures.length, this.unpaidBonDeCommandes.length],
            backgroundColor: '#F44336',
            stack: 'Stack 0'
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          x: { stacked: true },
          y: { stacked: true, beginAtZero: true }
        },
        plugins: {
          title: {
            display: true,
            text: `Aperçu du statut du paiement - Année ${this.selectedYear}`
          },
          tooltip: {
            callbacks: {
              afterLabel: (context) => {
                const dataIndex = context.dataIndex;
                let paid, unpaid;

                if (dataIndex === 0) {
                  paid = this.paidFactures.length;
                  unpaid = this.unpaidFactures.length;
                } else {
                  paid = this.paidBonDeCommandes.length;
                  unpaid = this.unpaidBonDeCommandes.length;
                }

                const total = paid + unpaid;
                const value = context.dataset.data[dataIndex] as number;
                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                const label = context.label === 'Payé' ? 'payés' : 'non payés';

                return `${percentage}% des ${context.dataset.label === 'Payé' ? 'documents payés' : 'documents non payés'}`;
              }
            }
          }
        }
      }
    });
  }

  // Modified to accept force recreation parameter
  createDonutChart(forceRecreate: boolean = false): void {
    const ctx = document.getElementById('donutChart') as HTMLCanvasElement;
    if (!ctx) return;

    // Destroy existing chart if it exists or if forced
    if (this.donutChart || forceRecreate) {
      this.donutChart?.destroy();
    }

    const totalPaid = this.paidFactures.length + this.paidBonDeCommandes.length;
    const totalUnpaid = this.unpaidFactures.length + this.unpaidBonDeCommandes.length;

    this.donutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Payé', 'Non payé'],
        datasets: [{
          data: [totalPaid, totalUnpaid],
          backgroundColor: ['#4CAF50', '#F44336'],
          borderWidth: 0,
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          title: {
            display: true,
            text: `Répartition du statut de paiement - Année ${this.selectedYear}`,
            font: { size: 12 }
          },
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: (context) => {
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const value = context.raw as number;
                const percentage = Math.round((value / total) * 100);
                return `${context.label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }
}
