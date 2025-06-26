import {Component, OnInit} from '@angular/core';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router'; // Update import
import {SupplierService} from '../../supplier.service';
import {CommonModule, NgIf} from '@angular/common';

import { Chart, registerables } from 'chart.js';
import {FormsModule} from '@angular/forms';
Chart.register(...registerables);

@Component({
  selector: 'app-facture-page',
  standalone: true,
  imports: [
    NgIf,
    FormsModule,
    CommonModule],
  templateUrl: './facture-page.component.html',
  styleUrl: './facture-page.component.css'
})
export class FacturePageComponent implements OnInit {
  pdfSrc: SafeResourceUrl | null = null;
  paidFactures: any[] = [];
  unpaidFactures: any[] = [];
  isLoading = true;

  paidBonDeCommandes: any[] = [];
  unpaidBonDeCommandes: any[] = [];
  sendingBonDeCommandeEmails: {[key: number]: boolean} = {};
  updatingPayment: {[key: number]: boolean} = {};
  updatingBonDeCommandePayment: {[key: number]: boolean} = {};
  deletingFacture: {[key: number]: boolean} = {};
  deletingBonDeCommande: {[key: number]: boolean} = {};
  // Add these properties to your component
  selectedYear: number = new Date().getFullYear();
  availableYears: number[] = [];
  originalPaidFactures: any[] = [];
  originalUnpaidFactures: any[] = [];
  originalPaidBonDeCommandes: any[] = [];
  originalUnpaidBonDeCommandes: any[] = [];

// Add this to your FacturePageComponent
  supplierId: number | null = null;
// Add this property to your component
  supplierName: string | null = null;


// Add these properties to your component class
  clientEmail: string | undefined; // Should be populated with the client's email
  factureId: number | undefined; // Should be populated with the invoice ID
  currentDocument: string = ''; // To store the document content
  // Add these properties
  showEmailForm: boolean = false;
  emailSubject: string = 'Facture';
  emailBody: string = 'Veuillez trouver ci-joint votre facture.';
  currentFacture: any = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,  // Add this
    private supplierService: SupplierService,
    private sanitizer: DomSanitizer
  ) {
  }

  ngOnInit(): void {
    this.initializeAvailableYears();
    // Get supplierId from query parameters if exists
    this.route.queryParams.subscribe((params: {[key: string]: any}) => {
      this.supplierId = params['supplierId'] ? +params['supplierId'] : null;
      this.loadFactures();
    });

  }

  initializeAvailableYears(): void {
    const currentYear = new Date().getFullYear();
    this.availableYears = Array.from(
      { length: currentYear },
      (_, index) => currentYear - index
    );
    this.selectedYear = currentYear;
  }

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
        // Filter by supplier if supplierId is provided
        if (this.supplierId) {
          factures = factures.filter((f: any) => f.supplier?.id === this.supplierId);
          // Get supplier name from first matching facture
          if (factures.length > 0) {
            this.supplierName = factures[0].supplier?.name;
          }
        }

        this.originalPaidFactures = factures.filter((f: any) => f.payment);
        this.originalUnpaidFactures = factures.filter((f: any) => !f.payment);
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

  }
  resetYearFilter(): void {
    this.selectedYear = new Date().getFullYear(); // Reset to current year
    this.filterByYear();
  }


  goToPage(): void {
    this.router.navigate(['/home']);
  }
  goToReporting(): void {
    this.router.navigate(['/reporting']);
  }
  viewDocument(documentBase64: string): void {
    const byteCharacters = atob(documentBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });

    const url = URL.createObjectURL(blob);
    this.pdfSrc = this.sanitizer.bypassSecurityTrustResourceUrl(url);

    const modal = document.getElementById('pdfModal');
    if (modal) {
      (modal as any).style.display = 'block';
      modal.classList.add('show');
      modal.setAttribute('aria-modal', 'true');
      modal.removeAttribute('aria-hidden');
    }
  }


  sendingEmails: {[key: number]: boolean} = {};

  // Update your send method
// Method to open email form
  openEmailForm(facture: any) {
    this.currentFacture = facture;
    // Reset form fields to defaults when opening
    this.emailSubject = 'Facture';
    this.emailBody = 'Veuillez trouver ci-joint votre facture.';
    this.showEmailForm = true;
  }

// Method to send email
  sendFactureByEmail() {
    if (!this.currentFacture) return;

    const document = this.currentFacture.document;
    const email = this.currentFacture.supplier?.email;
    const factureId = this.currentFacture.facture_id;

    if (!email) {
      alert('Aucune adresse e-mail disponible pour ce fournisseur');
      return;
    }

    if (!this.emailSubject || !this.emailBody) {
      alert('Veuillez saisir un sujet et un corps pour l\'email');
      return;
    }

    this.sendingEmails[factureId] = true;

    this.supplierService.sendFactureByEmailaa(
      document,
      email,
      this.emailSubject,
      this.emailBody
    ).subscribe({
      next: () => {
        this.sendingEmails[factureId] = false;
        alert(`Facture envoyée avec succès à ${email}`);
        this.showEmailForm = false;
        // Reset form fields to defaults when opening
        this.emailSubject = 'Facture';
        this.emailBody = 'Veuillez trouver ci-joint votre facture.';
      },
      error: (err) => {
        this.sendingEmails[factureId] = false;
        console.error('Error sending email:', err);
        alert('Échec de l\'envoi de l\'e-mail: ' + (err.message || 'Erreur inconnue'));
      }
    });
  }


  sendBonDeCommandeByEmail(document: string, email: string | undefined, commandeId: number) {
    if (!email) {
      alert('Aucune adresse email disponible pour ce Grossiste');
      return;
    }

    this.sendingBonDeCommandeEmails[commandeId] = true;

    this.supplierService.sendBonDeCommandeByEmail(document, email).subscribe({
      next: () => {
        this.sendingBonDeCommandeEmails[commandeId] = false;
        alert(`Bon de commande envoyé avec succès à ${email}`);
      },
      error: (err) => {
        this.sendingBonDeCommandeEmails[commandeId] = false;
        console.error('Error sending email:', err);
        alert('Échec de l\'envoi de l\'e-mail: ' + (err.message || 'Erreur inconnue'));
      }
    });
  }

  toggleFacturePayment(factureId: number, newStatus: boolean): void {
    this.updatingPayment[factureId] = true;

    this.supplierService.updateFacturePaymentStatus(factureId, newStatus).subscribe({
      next: () => {
        const allFactures = [...this.paidFactures, ...this.unpaidFactures];
        const updatedFacture = allFactures.find(f => f.facture_id === factureId);

        if (updatedFacture) {
          updatedFacture.payment = newStatus;
          this.paidFactures = allFactures.filter(f => f.payment);
          this.unpaidFactures = allFactures.filter(f => !f.payment);
        }

        this.updatingPayment[factureId] = false;
        this.showSuccessToast(`Facture marquée comme ${newStatus ? 'payé' : 'non payé'}`);
      },
      error: (err) => {
        console.error('Error updating payment status:', err);
        this.updatingPayment[factureId] = false;
        this.showErrorToast('Échec de la mise à jour du statut de paiement');
      }
    });
  }

  toggleBonDeCommandePayment(commandeId: number, newStatus: boolean): void {
    this.updatingBonDeCommandePayment[commandeId] = true;

    this.supplierService.updateBonDeCommandePaymentStatus(commandeId, newStatus).subscribe({
      next: () => {
        const allCommandes = [...this.paidBonDeCommandes, ...this.unpaidBonDeCommandes];
        const updatedCommande = allCommandes.find(c => c.id === commandeId);

        if (updatedCommande) {
          updatedCommande.payment = newStatus;
          this.paidBonDeCommandes = allCommandes.filter(c => c.payment);
          this.unpaidBonDeCommandes = allCommandes.filter(c => !c.payment);
        }

        this.updatingBonDeCommandePayment[commandeId] = false;
        this.showSuccessToast(`Bon de commande marqué comme ${newStatus ? 'payé' : 'non payé'}`);
      },
      error: (err) => {
        console.error('Error updating payment status:', err);
        this.updatingBonDeCommandePayment[commandeId] = false;
        this.showErrorToast('Échec de la mise à jour du statut de paiement');
      }
    });
  }

  private showSuccessToast(message: string): void {
    alert(message);
  }

  private showErrorToast(message: string): void {
    alert('Error: ' + message);
  }

  private confirmDelete(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (confirm(message)) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  }

  async deleteFacture(factureId: number): Promise<void> {
    const confirmed = await this.confirmDelete('Êtes-vous sûr de vouloir supprimer cette facture ?');
    if (!confirmed) return;

    this.deletingFacture[factureId] = true;

    this.supplierService.deleteFacture(factureId).subscribe({
      next: () => {
        this.paidFactures = this.paidFactures.filter(f => f.facture_id !== factureId);
        this.unpaidFactures = this.unpaidFactures.filter(f => f.facture_id !== factureId);
        this.deletingFacture[factureId] = false;
        this.showSuccessToast('Facture supprimée avec succès');
      },
      error: (err) => {
        console.error('Error deleting facture:', err);
        this.deletingFacture[factureId] = false;
        this.showErrorToast('Échec de la suppression de la facture');
      }
    });
  }

  async deleteBonDeCommande(commandeId: number): Promise<void> {
    const confirmed = await this.confirmDelete('Êtes-vous sûr de vouloir supprimer ce bon de commande ?');
    if (!confirmed) return;

    this.deletingBonDeCommande[commandeId] = true;

    this.supplierService.deleteBonDeCommande(commandeId).subscribe({
      next: () => {
        this.paidBonDeCommandes = this.paidBonDeCommandes.filter(c => c.id !== commandeId);
        this.unpaidBonDeCommandes = this.unpaidBonDeCommandes.filter(c => c.id !== commandeId);
        this.deletingBonDeCommande[commandeId] = false;
        this.showSuccessToast('Bon de commande supprimé avec succès');
      },
      error: (err) => {
        console.error('Error deleting bon de commande:', err);
        this.deletingBonDeCommande[commandeId] = false;
        this.showErrorToast('Échec de la suppression du bon de commande');
      }
    });
  }

}
