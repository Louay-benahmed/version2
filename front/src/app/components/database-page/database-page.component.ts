import {Component, OnInit} from '@angular/core';
import {NgIf, CommonModule} from '@angular/common';
import {Router} from '@angular/router';
import { SupplierService } from '../../supplier.service';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';
import { Chart, registerables } from 'chart.js';
import {FormsModule} from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { provideToastr } from 'ngx-toastr';
import { provideAnimations } from '@angular/platform-browser/animations';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
Chart.register(...registerables);
@Component({
  selector: 'app-database-page',
  standalone: true,
  imports: [
    NgIf,
    FormsModule,
    CommonModule
  ],
  templateUrl: './database-page.component.html',
  styleUrl: './database-page.component.css'
})
export class DatabasePageComponent implements OnInit{

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
  // Add these properties to your component
  selectedYear: number = new Date().getFullYear();
  availableYears: number[] = [];
  originalPaidFactures: any[] = [];
  originalUnpaidFactures: any[] = [];
  originalPaidBonDeCommandes: any[] = [];
  originalUnpaidBonDeCommandes: any[] = [];


// Add these properties to your component class
  clientEmail: string | undefined; // Should be populated with the client's email
  factureId: number | undefined; // Should be populated with the invoice ID
  currentDocument: string = ''; // To store the document content
  // Add these properties
  showEmailForm: boolean = false;
  emailSubject: string = 'Facture';
  emailBody: string = 'Veuillez trouver ci-joint votre facture.';
  currentFacture: any = null;
// Add these properties to your component
  exportHistory: any[] = []; // For "base de donner Exporter"
  clientExportData: any[] = []; // For "donnes des clients Exporter"
  originalExportHistory: any[] = [];
  originalClientExportData: any[] = [];
// Component properties - changed to any[] to match service
  databaseExports: any[] = [];
  supplierExports: any[] = [];
  originalDatabaseExports: any[] = [];
  originalSupplierExports: any[] = [];
  isExporting = false;
  // Add to your component properties
  excelData: any = null;
  currentExport: any = null;
  isLoadingExcel: boolean = false;
  excelModalVisible: boolean = false;

  constructor(
    private router: Router,
    private supplierService: SupplierService,
    private sanitizer: DomSanitizer, private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.initializeAvailableYears();
    this.loadSuppliers();
    this.loadExportData(); // New method to load all export data
    console.log('Initial suppliers:', this.suppliers);
    console.log('Initial selectedSupplierId:', this.selectedSupplierId);
  }
// New method to load export data
// Load data method - unchanged except for type inference
  loadExportData(): void {
    this.isLoading = true;

    forkJoin([
      this.supplierService.getDatabaseExports(),
      this.supplierService.getSupplierExports()
    ]).subscribe({
      next: ([dbExports, supplierExports]) => {
        this.originalDatabaseExports = dbExports;
        this.originalSupplierExports = supplierExports;

        // Apply initial filters
        this.filterDatabaseExports();
        this.filterClientExports();
        console.log('Database exports:', dbExports);
        console.log('Supplier exports:', supplierExports);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading export data:', err);
        this.isLoading = false;
      }
    });
  }
  exportToExcel() {
    this.isExporting = true;
    this.supplierService.exportSuppliersToExcel().subscribe({
      next: () => {
        this.isExporting = false;
        this.toastr.success('Export Excel terminé avec succès', 'Succès');
      },
      error: (err) => {
        this.isExporting = false;
        this.toastr.error('Erreur lors de l\'export Excel', 'Erreur');
        console.error('Export error:', err);
      }
    });
  }
  // For Database Exports (year only)
  filterDatabaseExports(): void {
    if (!this.selectedYear) {
      this.databaseExports = [...this.originalDatabaseExports];
      return;
    }

    const targetYear = Number(this.selectedYear);
    this.databaseExports = this.originalDatabaseExports.filter(item => {
      const date = new Date(item.creationDate);
      return date.getUTCFullYear() === targetYear;
    });
  }

// For Client Exports (year + supplier)
  filterClientExports(): void {
    let filteredData = [...this.originalSupplierExports];

    // Filter by year if selected
    if (this.selectedYear) {
      const targetYear = Number(this.selectedYear);
      filteredData = filteredData.filter(item => {
        const date = new Date(item.creationDate);
        return date.getUTCFullYear() === targetYear;
      });
    }

    // Filter by client if selected
    if (this.selectedSupplierId) {
      const supplier = this.suppliers.find(s => s.id === this.selectedSupplierId);
      if (supplier) {
        filteredData = filteredData.filter(item => {
          // Check both possibilities:
          // 1. Direct supplierId match (if available in data)
          // 2. Filename pattern match
          return (item.supplierId === this.selectedSupplierId) ||
            (item.fileName?.toLowerCase().startsWith(supplier.name.toLowerCase() + '_'));
        });
      }
    }

    this.supplierExports = filteredData;
  }
  extractClientNameFromFileName(filename: string): string {
    if (!filename) return '';

    // Extract the part before the first underscore
    const underscoreIndex = filename.indexOf('_');
    if (underscoreIndex > 0) {
      return filename.substring(0, underscoreIndex);
    }

    return filename; // fallback if no underscore found
  }
  filterSupplierExports(): void {
    let filteredData = [...this.originalSupplierExports];

    // Filter by year if selected
    if (this.selectedYear) {
      const targetYear = Number(this.selectedYear);
      filteredData = filteredData.filter(item => {
        const date = new Date(item.creationDate);
        return date.getUTCFullYear() === targetYear;
      });
    }

    // Filter by client if selected
    if (this.selectedSupplierId) {
      // Assuming supplier name is part of the filename
      const supplier = this.suppliers.find(s => s.id === this.selectedSupplierId);
      if (supplier) {
        filteredData = filteredData.filter(item =>
          item.fileName.includes(supplier.name)
        );
      }
    }

    this.supplierExports = filteredData;
  }
  // Filter methods
  filterExportHistoryByYear(): void {
    if (!this.selectedYear) {
      this.exportHistory = [...this.originalExportHistory];
      return;
    }

    const targetYear = Number(this.selectedYear);
    this.exportHistory = this.originalExportHistory.filter(item => {
      const date = new Date(item.creationDate);
      return date.getUTCFullYear() === targetYear;
    });
  }

  filterClientExportData(): void {
    let filteredData = [...this.originalClientExportData];

    // Filter by year if selected
    if (this.selectedYear) {
      const targetYear = Number(this.selectedYear);
      filteredData = filteredData.filter(item => {
        const date = new Date(item.creationDate);
        return date.getUTCFullYear() === targetYear;
      });
    }

    // Filter by client if selected
    if (this.selectedSupplierId) {
      filteredData = filteredData.filter(item =>
        item.supplierId === this.selectedSupplierId
      );
    }

    this.clientExportData = filteredData;
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
  // Replace your current filter methods with these:

  filterByYear(): void {
    if (!this.selectedYear) return;

    const targetYear = Number(this.selectedYear);
    console.log(`Filtering for year: ${targetYear}`);

    // Filter database exports (year only)
    this.databaseExports = this.originalDatabaseExports.filter(item => {
      if (!item.creationDate) return false;
      const date = new Date(item.creationDate);
      return date.getUTCFullYear() === targetYear;
    });

    // Filter client exports (year + optional supplier)
    let clientExports = [...this.originalSupplierExports];
    clientExports = clientExports.filter(item => {
      if (!item.creationDate) return false;
      const date = new Date(item.creationDate);
      return date.getUTCFullYear() === targetYear;
    });

    // Apply additional supplier filter if selected
    if (this.selectedSupplierId) {
      const supplier = this.suppliers.find(s => s.id === this.selectedSupplierId);
      if (supplier) {
        clientExports = clientExports.filter(item =>
          item.supplierId === this.selectedSupplierId ||
          item.fileName?.toLowerCase().startsWith(supplier.name.toLowerCase() + '_')
        );
      }
    }

    this.supplierExports = clientExports;
  }

  resetYearFilter(): void {
    this.selectedYear = new Date().getFullYear();
    this.filterByYear();
  }
  filterByYear_BDC(): void {
    if (!this.selectedYear) return;

    const targetYear = Number(this.selectedYear);

    const filterByYear = (items: any[]): any[] => {
      return items.filter(item => {
        if (!item.dateCreation) return false;
        const date = new Date(item.dateCreation);
        return date.getUTCFullYear() === targetYear;
      });
    };

    // If a supplier is selected, filter the already loaded supplier invoices
    if (this.selectedSupplierId) {
      this.paidFactures = filterByYear(this.paidFactures);
      this.unpaidFactures = filterByYear(this.unpaidFactures);
    } else {
      // Normal year filtering for all invoices
      this.paidFactures = filterByYear(this.originalPaidFactures);
      this.unpaidFactures = filterByYear(this.originalUnpaidFactures);
      this.paidBonDeCommandes = filterByYear(this.originalPaidBonDeCommandes);
      this.unpaidBonDeCommandes = filterByYear(this.originalUnpaidBonDeCommandes);
    }
  }
  resetYearFilter_BDC(): void {
    this.selectedYear = new Date().getFullYear();
    if (this.selectedSupplierId) {
      // If supplier is selected, reload their invoices
      this.filterBySupplier();
    } else {
      // Otherwise reload all invoices
      this.filterByYear();
    }
  }


  goToPage(): void {
    const newTab = window.open('/home', '_blank');
    if (newTab) {
      window.close(); // Tries to close the current tab
    }
  }
  goToReporting(): void {
    this.router.navigate(['/reporting']);
  }
  goTobdc(): void {
    this.router.navigate(['/management bon de commande']);
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
  // Add with other properties
  suppliers: any[] = [];
  selectedSupplierId: number | null = null;
  isLoadingSuppliers: boolean = false;
  // Add after ngOnInit()
  loadSuppliers(): void {
    this.isLoadingSuppliers = true;
    this.supplierService.getSuppliers().subscribe({
      next: (suppliers) => {
        this.suppliers = suppliers;
        this.isLoadingSuppliers = false;
      },
      error: (err) => {
        console.error('Error loading suppliers:', err);
        this.isLoadingSuppliers = false;
      }
    });
  }
  // Add this method
  onSupplierChange(): void {
    console.log('Selected supplier ID:', this.selectedSupplierId);

    if (this.selectedSupplierId) {
      const supplier = this.suppliers.find(s => s.id === this.selectedSupplierId);
      console.log('Selected supplier name:', supplier?.name);

      // Log sample matching for debugging
      const sampleExports = this.originalSupplierExports.slice(0, 3);
      console.log('Sample exports:', sampleExports.map(e => ({
        fileName: e.fileName,
        matches: e.fileName?.toLowerCase().startsWith(supplier?.name?.toLowerCase() + '_')
      })));
    }

    this.filterClientExports();
  }

// Update filterBySupplier to include validation
  filterBySupplier(): void {
    const selectedSupplier = this.suppliers.find(s =>
      s.supplier_id === this.selectedSupplierId || s.id === this.selectedSupplierId
    );
    console.log('Selected Supplier:', selectedSupplier);

    if (this.selectedSupplierId === null || this.selectedSupplierId === undefined || isNaN(this.selectedSupplierId)) {
      console.error('Invalid supplier ID:', this.selectedSupplierId);
      return;
    }

    this.isLoading = true;

    forkJoin([
      this.supplierService.getPaidFacturesBySupplier(+this.selectedSupplierId),
      this.supplierService.getUnpaidFacturesBySupplier(+this.selectedSupplierId)
    ]).subscribe({
      next: ([paidFactures, unpaidFactures]) => {
        // Store the supplier-filtered invoices
        this.originalPaidFactures = paidFactures;
        this.originalUnpaidFactures = unpaidFactures;

        // Apply year filter if one is selected
        if (this.selectedYear) {
          this.applyYearFilter();
        } else {
          this.paidFactures = paidFactures;
          this.unpaidFactures = unpaidFactures;
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading supplier invoices:', err);
        this.isLoading = false;
      }
    });
  }

// New helper method
  private applyYearFilter(): void {
    if (!this.selectedYear) return;

    const targetYear = Number(this.selectedYear);

    this.paidFactures = this.originalPaidFactures.filter(f => {
      if (!f.dateCreation) return false;
      const date = new Date(f.dateCreation);
      return date.getUTCFullYear() === targetYear;
    });

    this.unpaidFactures = this.originalUnpaidFactures.filter(f => {
      if (!f.dateCreation) return false;
      const date = new Date(f.dateCreation);
      return date.getUTCFullYear() === targetYear;
    });
  }
  clearSupplierFilter(): void {
    this.selectedSupplierId = null;
    this.loadFactures(); // Reload all invoices
  }

  getSupplierName(supplierId: number): string {
    const supplier = this.suppliers.find(s => s.supplier_id === supplierId);
    return supplier ? supplier.name : '';
  }
  getSelectedSupplierName(): string {
    if (!this.selectedSupplierId) return '';
    const supplier = this.suppliers.find(s =>
      s.supplier_id === this.selectedSupplierId || s.id === this.selectedSupplierId
    );
    return supplier?.name || '';
  }
// Update your existing year filter method
  onYearChange(): void {
    this.filterDatabaseExports(); // Affects only database exports
    this.filterClientExports();   // Affects client exports
  }
  getClientDisplayName(exportItem: any): string {
    // First try to get from supplier ID
    if (exportItem.supplierId) {
      const name = this.getSupplierName(exportItem.supplierId);
      if (name) return name;
    }

    // Then try to extract from filename
    if (exportItem.fileName) {
      return this.extractClientNameFromFileName(exportItem.fileName);
    }

    return 'Unknown Client';
  }
  protected readonly document = document;
// Add these methods to your component class

  async viewExport(exportItem: any, type: 'database' | 'supplier'): Promise<void> {
    this.currentExport = exportItem;
    this.excelData = null;
    this.isLoadingExcel = true;
    this.excelModalVisible = true;

    try {
      const byteCharacters = atob(exportItem.fileContent);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);

      // Parse the Excel file
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(byteArray);

      // Get the first worksheet
      const worksheet = workbook.worksheets[0];

      // Get actual used range (alternative method)
      const dimensions = worksheet.dimensions;
      const colCount = dimensions ? dimensions.right - dimensions.left + 1 : 0;

      // Extract headers
      const headers = [];
      if (worksheet.rowCount > 0) {
        const headerRow = worksheet.getRow(1);
        for (let col = 1; col <= colCount; col++) {
          const cell = headerRow.getCell(col);
          headers.push(cell.text || ''); // Empty string instead of 'Column X'
        }
      }

      // Extract data rows
      const rows = [];
      for (let rowNum = 2; rowNum <= worksheet.rowCount; rowNum++) {
        const row = [];
        const currentRow = worksheet.getRow(rowNum);
        for (let col = 1; col <= colCount; col++) {
          const cell = currentRow.getCell(col);
          row.push(cell.text || '');
        }
        rows.push(row);
      }

      this.excelData = {
        headers: headers,
        rows: rows,
        fileName: exportItem.fileName
      };
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      this.toastr.error('Could not parse Excel file, downloading instead');
      this.downloadExcel(exportItem);
      this.excelModalVisible = false;
    } finally {
      this.isLoadingExcel = false;
    }
  }  downloadCurrentExcel(): void {
    if (this.currentExport) {
      this.downloadExcel(this.currentExport);
    }
    this.excelModalVisible = false;
  }

  private downloadExcel(exportItem: any): void {
    const byteCharacters = atob(exportItem.fileContent);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    saveAs(blob, exportItem.fileName || `export_${new Date().getTime()}.xlsx`);
  }

  closeExcelModal(): void {
    this.excelModalVisible = false;
    this.excelData = null;
    this.currentExport = null;
  }

  async confirmDeleteExport(exportItem: any, type: 'database' | 'supplier'): Promise<void> {
    const confirmed = await this.confirmDelete(`Are you sure you want to delete this ${type} export?`);
    if (!confirmed) return;

    this.supplierService.deleteExport(exportItem.id).subscribe({
      next: () => {
        this.toastr.success('Export deleted successfully');
        // Remove from the appropriate array
        if (type === 'database') {
          this.databaseExports = this.databaseExports.filter(e => e.id !== exportItem.id);
          this.originalDatabaseExports = this.originalDatabaseExports.filter(e => e.id !== exportItem.id);
        } else {
          this.supplierExports = this.supplierExports.filter(e => e.id !== exportItem.id);
          this.originalSupplierExports = this.originalSupplierExports.filter(e => e.id !== exportItem.id);
        }
      },
      error: (err) => {
        console.error('Error deleting export:', err);
        this.toastr.error('Failed to delete export');
      }
    });
  }

}

