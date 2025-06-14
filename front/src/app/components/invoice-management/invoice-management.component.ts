import {Component, OnInit} from '@angular/core';
import {NgIf, NgOptimizedImage, CommonModule} from '@angular/common';
import {Router} from '@angular/router';

import { SupplierService } from '../../supplier.service';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';

import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);
@Component({
  selector: 'app-invoice-management',
  standalone: true,
  imports: [
    NgIf,
    NgOptimizedImage,
    CommonModule
  ],
  templateUrl: './invoice-management.component.html',
  styleUrl: './invoice-management.component.css'
})
export class InvoiceManagementComponent  implements OnInit {
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
      },
      error: (err) => {
        console.error('Erreur lors du chargement des factures:', err);
        this.isLoading = false;
      }
    });
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

  sendFactureByEmail(document: string, email: string | undefined, factureId: number) {
    if (!email) {
      alert('Aucune adresse e-mail disponible pour ce Client');
      return;
    }

    this.sendingEmails[factureId] = true;

    this.supplierService.sendFactureByEmail(document, email).subscribe({
      next: () => {
        this.sendingEmails[factureId] = false;
        alert(`Facture envoyée avec succès à ${email}`);
      },
      error: (err) => {
        this.sendingEmails[factureId] = false;
        console.error('Error sending email:', err);
        alert('Échec de l\'envoi de l\'e-mail: ' + (err.message || 'Erreur inconnue'));
      }
    });
  }
  loadBonDeCommandes(): void {
    this.supplierService.getAllBonDeCommandes().subscribe({
      next: (commandes) => {
        this.paidBonDeCommandes = commandes.filter((c: any) => c.payment);
        this.unpaidBonDeCommandes = commandes.filter((c: any) => !c.payment);
      },
      error: (err) => {
        console.error('Error loading bon de commandes:', err);
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
