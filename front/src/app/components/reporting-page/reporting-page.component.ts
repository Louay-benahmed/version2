import {Component, OnInit} from '@angular/core';
import {NgIf, NgOptimizedImage, CommonModule} from '@angular/common';
import {Router} from '@angular/router';

import { SupplierService } from '../../supplier.service';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';

import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-reporting-page',
  standalone: true,
  imports: [
    NgIf,
    NgOptimizedImage,
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





  constructor(
    private router: Router,
    private supplierService: SupplierService,
    private sanitizer: DomSanitizer
  ) {
  }

  ngOnInit(): void {
    this.loadFactures();
    this.loadBonDeCommandes();

  }

  loadFactures(): void {
    this.supplierService.getAllFactures().subscribe({
      next: (factures) => {
        this.paidFactures = factures.filter((f: any) => f.payment);
        this.unpaidFactures = factures.filter((f: any) => !f.payment);
        this.isLoading = false;
        this.createPaymentChart();
        this.createDonutChart();

      },
      error: (err) => {
        console.error('Error loading factures:', err);
        this.isLoading = false;
      }
    });
  }


  goToPage(): void {
    this.router.navigate(['/home']);
  }
  goToPageManagement(): void {
    this.router.navigate(['/management']);
  }


  loadBonDeCommandes(): void {
    this.supplierService.getAllBonDeCommandes().subscribe({
      next: (commandes) => {
        this.paidBonDeCommandes = commandes.filter((c: any) => c.payment);
        this.unpaidBonDeCommandes = commandes.filter((c: any) => !c.payment);
        this.createPaymentChart(); // Add this line
        //this.createDonutChart(); // Add this
        this.createDonutChart(); // Add this



      },
      error: (err) => {
        console.error('Error loading bon de commandes:', err);
      }
    });
  }

  createPaymentChart(): void {
    if (this.paymentChart) {
      this.paymentChart.destroy();
    }

    const ctx = document.getElementById('paymentChart') as HTMLCanvasElement;
    if (!ctx) return;

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
          x: {
            stacked: true,
          },
          y: {
            stacked: true,
            beginAtZero: true
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Aperçu du statut du paiement'
          },
          tooltip: {
            callbacks: {
              afterLabel: (context) => {
                const dataset = context.dataset;
                const dataIndex = context.dataIndex;
                const label = context.label;

                // Get the values for the current stack (Factures or Bons de commande)
                let paid, unpaid;

                if (dataIndex === 0) { // Factures
                  paid = this.paidFactures.length;
                  unpaid = this.unpaidFactures.length;
                } else { // Bons de commande
                  paid = this.paidBonDeCommandes.length;
                  unpaid = this.unpaidBonDeCommandes.length;
                }

                const total = paid + unpaid;
                const value = dataset.data[dataIndex] as number;

                // Calculate percentage for the current segment (paid or unpaid)
                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

                return `${percentage}% du total des ${label.toLowerCase()}`;
              }
            }
          }
        }
      }
    });
  }
  createDonutChart(): void {
    if (this.donutChart) {
      this.donutChart.destroy();
    }

    const ctx = document.getElementById('donutChart') as HTMLCanvasElement;
    if (!ctx) return;

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
        layout: {
          padding: {
            top: 10
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Répartition du statut de paiement',
            position: 'top',
            font: {
              size: 12
            },
            padding: {
              bottom: 10
            }
          },
          legend: {
            position: 'top',
            align: 'center',
            labels: {
              boxWidth: 40,
              padding: 10,
              usePointStyle: false,
              pointStyle: 'rect',
              font: {
                size: 12
              }
            }
          },
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
  }}
