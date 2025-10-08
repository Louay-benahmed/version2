import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';

import { SupplierService } from '../../supplier.service';
import {ClientExcelData, Solution, Supplier} from '../../models/supplier';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Chart} from 'chart.js';

import { ToastrService } from 'ngx-toastr';
import { provideToastr } from 'ngx-toastr';
import { provideAnimations } from '@angular/platform-browser/animations';
import * as ExcelJS from 'exceljs';
import {saveAs} from 'file-saver';
@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    FormsModule,
    NgIf,
    HttpClientModule,
    CommonModule
  ],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.css',
  providers: [SupplierService]
})
export class HomePageComponent implements OnInit {
  showSigninDiv: boolean = false;
  showOtherDiv: boolean = false;
  showClientDiv: boolean = false;
  showSupplierDiv: boolean = false;
  showInfoSupplierDiv: boolean = false;
  showAddSupplierDiv: boolean = false;
  showClientInfoDiv: boolean = false;
  showInfoClientInfoDiv: boolean = false;
  showAddClientInfoDiv: boolean = false;
  showSolutionDiv: boolean = false;

  suppliers: Supplier[] = [];
  selectedSupplier: any = null;
  SelectedSupplier: any = {
    name: '',
    email: '',
    matricule_fiscale: '',
    adress: '',
    dateDeContrat: null,
    RIB: null
  };  clients: any[] = [];
  selectedClient: any = null;
  SelectedClient: any = { name: '', email: '', matricule_fiscale: '', adress: '', uniqueIdentifier: '' };
  // Add these properties
  showSupplierPaymentChartDiv = false;
  private supplierPaymentChart: Chart | null = null;
  paidFacturesForSupplier: any[] = [];
  unpaidFacturesForSupplier: any[] = [];
  // Add these properties
  availableYears: number[] = [];
  supplierSelectedYear: number = new Date().getFullYear();
  originalPaidFacturesForSupplier: any[] = [];
  originalUnpaidFacturesForSupplier: any[] = [];
  // Add these properties
  showClientPaymentChartDiv = false;
  clientSelectedYear: number = new Date().getFullYear();
  private clientPaymentChart: Chart | null = null;
  paidBonDeCommandesForClient: any[] = [];
  unpaidBonDeCommandesForClient: any[] = [];
  originalPaidBonDeCommandesForClient: any[] = [];
  originalUnpaidBonDeCommandesForClient: any[] = [];

  showSpecificSolutionDiv: boolean = false;



  selectedSupplierId: number | null = null;

  isLoading = true;
  errorMessage = '';
  solutions: Solution[] = [];

  // Add these properties to your component
  showExcelDataDiv: boolean = false;
  showExcelDataInfoDiv: boolean = false;
  clientExcelData: ClientExcelData | null = null;
  // Add this property to track export state
  isExporting = false;
  // Track modified solutions
  modifiedSolutions: {[key: number]: number} = {};
  // Add these new properties for price management
  private originalPrices: { [id: number]: number } = {};
  private resetTimer: any;
// Add these properties
  private invoiceGenerationFlag = false;
  private lastInvoiceTime: Date | null = null;
  private isGeneratingInvoice = false;
  // Add to your component properties
  excelData: any = null;
  currentExport: any = null;
  isLoadingExcel: boolean = false;
  excelModalVisible: boolean = false;
  showX: boolean = false; // false = showing paid invoices (initial state)

/////////////////////////////////////////////////////////////////////////////////////////////////
  // Modified onPriceChange to track original prices
  // Modified onPriceChange
  onPriceChange(solutionId: number, newPrice: number) {
    if (!this.originalPrices[solutionId]) {
      const solution = this.supplierSolutions.find(s => s.id === solutionId);
      if (solution) {
        this.originalPrices[solutionId] = solution.prix;
        console.log(`Stored original price for ${solutionId}:`, solution.prix);
      }
    }
    this.modifiedSolutions[solutionId] = newPrice;
    console.log(`Updated price for ${solutionId}:`, newPrice);
  }
  // Enhanced savePriceChanges with error handling
  // Save changes (update DB)
  public async savePriceChanges(): Promise<void> {
    const updates = Object.keys(this.modifiedSolutions).map(id => ({
      id: +id,
      newPrice: this.modifiedSolutions[+id] // Fixed: use +id to ensure number type
    }));

    console.log('Saving these changes:', updates);

    await Promise.all(
      updates.map(({id, newPrice}) =>
        this.supplierService.updateSolutionPrix(id, newPrice).toPromise()
      ) // Added missing parenthesis
    );
  }

  // Modified toggleSpecificSolutionnDiv
  toggleSpecificSolutionnDiv(): void {
    this.showSpecificSolutionDiv = !this.showSpecificSolutionDiv;
    if (this.showSpecificSolutionDiv) {
      this.loadAllAvailableSolutions();
      if (this.selectedSupplierId) {
        this.loadSupplierAssociatedSolutions();
      }
    }
  }
  private async resetPrices(): Promise<void> {
    const resets = Object.keys(this.originalPrices).map(id => ({
      id: +id,
      originalPrice: this.originalPrices[+id] // Fixed: use +id to ensure number type
    }));

    console.log('Resetting these prices:', resets);

    await Promise.all(
      resets.map(({id, originalPrice}) =>
        this.supplierService.updateSolutionPrix(id, originalPrice).toPromise()
      ) // Added missing parenthesis
    );


    // Clear state
    this.modifiedSolutions = {};
    this.originalPrices = {};
  }


  // New method to handle invoice button click
  // Invoice generation flow
  async handleInvoiceGeneration() {
    if (this.isGeneratingInvoice) return;
    this.isGeneratingInvoice = true;

    try {
      console.group('Invoice Process');

      // 1. Save modified prices
      if (Object.keys(this.modifiedSolutions).length > 0) {
        console.log('Saving price changes to DB...');
        await this.savePriceChanges();
      }

      // 2. Reset prices
      console.log('Resetting prices to originals...');
      await this.resetPrices();

      console.log('Invoice process completed successfully');
    } catch (error) {
      console.error('Invoice process failed:', error);
      this.toastr.error('Invoice generation failed');
    } finally {
      this.isGeneratingInvoice = false;
      console.groupEnd();
    }
  }


  async specific_billing() {
    this.generateInvoice(this.selectedSupplierId!);
  }

  async executeFullInvoiceProcess() {
    try {
      // 1. Save price changes (if any)
      if (Object.keys(this.modifiedSolutions).length > 0) {
        await this.savePriceChanges();
      }

      // 2. Execute specific billing
      await this.specific_billing();

      // 3. Handle invoice generation toggleSpecificSolutionnDiv
      await this.handleInvoiceGeneration();

      // 3. close the div  toggleSpecificSolutionnDiv
      await this.toggleSpecificSolutionnDiv();

      // Optional: Show success message
      this.toastr.success('Invoice process completed successfully');
    } catch (error) {
      console.error('Full invoice process failed:', error);
      this.toastr.error('Full invoice process failed');
      throw error; // Re-throw if you want calling code to handle it
    }
  }

  // New method to reset prices
  private async resetPricesToOriginal() {
    try {
      const revertPromises = Object.keys(this.originalPrices).map(id => {
        const solutionId = +id;
        return this.supplierService.updateSolutionPrix(
          solutionId,
          this.originalPrices[solutionId]
        ).toPromise();
      });

      await Promise.all(revertPromises);
      this.modifiedSolutions = {};
      this.originalPrices = {};

      // Refresh solutions to show original prices
      if (this.selectedSupplierId) {
        await this.loadSupplierAssociatedSolutions();
      }

      console.log('Prices automatically reset to original values');
    } catch (error) {
      console.error('Error resetting prices:', error);
    }
  }

  // Don't forget to clean up in ngOnDestroy
  ngOnDestroy(): void {
    this.destroySupplierPaymentChart();

    // ... any other cleanup you have
  }
  toggleSolutionnDiv(): void {
    this.showSolutionDiv = !this.showSolutionDiv;
    if (this.showSolutionDiv) {
      this.loadAllAvailableSolutions();
      if (this.selectedSupplierId) {
        this.loadSupplierAssociatedSolutions();
      }
    }
  }
// Add this method for Excel export
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
// Add these methods to your component
  toggleShowExcelDataDiv(): void {
    this.showExcelDataDiv = !this.showExcelDataDiv;
    this.showExcelDataInfoDiv = !this.showExcelDataInfoDiv;
  }

  // Initialize empty Excel data
  private getEmptyExcelData(): ClientExcelData {
    return {
      janStatus: 'No',
      febStatus: 'No',
      marStatus: 'No',
      aprStatus: 'No',
      mayStatus: 'No',
      junStatus: 'No',
      julStatus: 'No',
      augStatus: 'No',
      sepStatus: 'No',
      octStatus: 'No',
      novStatus: 'No',
      decStatus: 'No',
      q1BcCount: 0,
      q2BcCount: 0,
      q3BcCount: 0,
      q4BcCount: 0,
      q1PaymentStatus: 'Unpaid',
      q2PaymentStatus: 'Unpaid',
      q3PaymentStatus: 'Unpaid',
      q4PaymentStatus: 'Unpaid',
      q1Amount: 0,
      q2Amount: 0,
      q3Amount: 0,
      q4Amount: 0,
      poids: 0,
      globalAmount: 0,
      annualPayment: 0,
      monthlyPayment: 0
    };
  }

  async fetchClientExcelData(): Promise<void> {
    // 1. First call the payment chart close function
    this.showClientPaymentChartclose();

    if (!this.selectedClient?.id) return;

    // 2. Wait for 2 seconds before proceeding with the Excel data fetch
    await new Promise(resolve => setTimeout(resolve, 50));

    // 3. Then execute the original Excel data fetching logic
    this.supplierService.getClientExcelData(this.selectedClient.id).subscribe({
      next: (data) => {
        console.log('Received Excel data from API:', data);
        const mergedData = this.getEmptyExcelData();

        if (data && typeof data === 'object') {
          Object.keys(data).forEach(key => {
            if (data[key] !== null && data[key] !== undefined) {
              mergedData[key] = data[key];
            }
          });
        }

        this.clientExcelData = mergedData;
        console.log('Merged Excel data:', this.clientExcelData);

        this.showExcelDataDiv = true;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching Excel data:', err);
        alert('Failed to fetch Excel data');
      }
    });
  }
  updateExcelData(): void {
    if (!this.selectedClient?.id || !this.clientExcelData) return;

    this.supplierService.updateClientExcelData(
      this.selectedClient.id,
      this.clientExcelData
    ).subscribe({
      next: () => {
        alert('Excel data updated successfully!');
        //this.showExcelDataDiv = false;
        this.fetchClientExcelData();
      },
      error: (err) => {
        console.error('Error updating Excel data:', err);
        alert('Failed to update Excel data');
      }
    });
  }
////////////////////////////////////////////////////////////////////////

  constructor(private supplierService: SupplierService, private router: Router, private cd: ChangeDetectorRef, private toastr: ToastrService) {}

  scrollToReports(): void {
    this.showClientDiv = true;

    setTimeout(() => {
      const element = document.getElementById('div_client');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 200);
  }



  goToPage() {
    this.router.navigate(['/management']);
  }

  goToDataBase() {
    this.router.navigate(['/database']);
  }
  goToPayement() {
    this.router.navigate(['/payment']);
  }

  async goToFacturePage(): Promise<void> {
    // First execute the payment chart function
    this.showSupplierPaymentChartclose();

    // Wait for 2 seconds before proceeding with navigation
    await new Promise(resolve => setTimeout(resolve, 50));

    // Then execute the original navigation logic
    if (this.selectedSupplier && this.selectedSupplier.id) {
      this.router.navigate(['/facture'], {
        queryParams: { supplierId: this.selectedSupplier.id }
      });
    } else {
      this.router.navigate(['/facture']);
    }
  }

  async goToBDCPage(): Promise<void> {
    // 1. First call the payment chart close function
    this.showClientPaymentChartclose();

    // 2. Wait for 2 seconds
    await new Promise(resolve => setTimeout(resolve, 50));

    // 3. Then execute the navigation
    if (this.selectedClient && this.selectedClient.name) {
      this.router.navigate(['/bdc'], {
        queryParams: { clientName: this.selectedClient.name }
      });
    } else {
      this.router.navigate(['/bdc']);
    }
  }

  goTosolutionPage() {
    this.router.navigate(['/solution']);
  }
  ngOnInit(): void {

    this.fetchSuppliers();
    this.loadSolutions();

  }

  toggleSolutionDiv(): void {
    this.showSupplierDiv = !this.showSupplierDiv;
  }
  fetchSuppliers(): void {
    this.supplierService.getSuppliers().subscribe(
      (data: Supplier[]) => {
        this.suppliers = data;
      },
      (error: any) => {
        console.error('Erreur lors de la récupération des clients :', error);
      }
    );
  }

  viewDetails(supplierId: number): void {
    this.selectedSupplierId = supplierId; // Store the ID

    this.supplierService.getSupplierById(supplierId).subscribe(
      (data) => {
        this.selectedSupplier = data;
        this.toggleShowInfoSupplierDiv();
      },
      (error) => {
        console.error('Erreur lors de la récupération des détails du client:', error);
      }
    );
  }

  toggleShowInfoSupplierDiv(): void {
    this.toggleInfoSupplierDiv(); // Calls another method (parent or service)
    this.showInfoSupplierDiv = !this.showInfoSupplierDiv; // Toggles visibility flag
  }

  toggleInfoSupplierDiv(): void {
    this.showSupplierDiv = !this.showSupplierDiv;
  }

  async toggleShowInfoSupplierDivclose(): Promise<void> {
    // First execute the payment chart function
    this.showSupplierPaymentChartclose();

    // Wait for 2 seconds before proceeding
    await new Promise(resolve => setTimeout(resolve, 100));

    // Then execute the original toggle functionality
    this.toggleInfoSupplierDiv();
    this.showInfoSupplierDiv = !this.showInfoSupplierDiv;
  }

  showSupplierPaymentChartclose(): void {
    // Toggle the visibility flag for the chart div
    this.showSupplierPaymentChartDiv = false;

    if (this.showSupplierPaymentChartDiv && this.selectedSupplier) {
      // If showing the chart and a supplier is selected:
      this.initializeAvailableYears(); // Load available years for data
      this.supplierSelectedYear = new Date().getFullYear(); // Set default to current year
      this.loadSupplierFactures(this.selectedSupplier.id); // Load invoices for selected supplier
    } else {
      // If hiding the chart:
      this.destroySupplierPaymentChart(); // Clean up chart resources
    }
  }

  toggleShowAddSupplierDiv(): void {
    this.toggleInfoSupplierDiv();
    this.showAddSupplierDiv = !this.showAddSupplierDiv;
  }


  async addSupplier(): Promise<void> {
    try {

        if (this.SelectedSupplier.name && this.SelectedSupplier.email) {
          const supplierToAdd = {
            ...this.SelectedSupplier,
            dateDeContrat: this.SelectedSupplier.dateDeContrat
          };

          this.supplierService.addSupplier(supplierToAdd).subscribe({
            next: (data) => {
              console.log('client ajouté avec succès:', data);
              alert('client ajouté avec succès!');
              this.toggleShowAddSupplierDiv();
              this.resetSupplierForm();
              this.loadSuppliers();
            },
            error: (error) => {
              console.error('Erreur lors de l\'ajout du client:', error);
              if (error.status === 403) {
                alert('Erreur lors de l\'ajout du client: le fournisseur existe déjà ou le type de saisie est invalide. Veuillez réessayer.');
              } else {
                alert('Erreur lors de l\'ajout du client: ' + (error.error?.message || 'Veuillez réessayer'));
              }
            }
          });
        } else {
          alert('Veuillez remplir les champs obligatoires (nom et email).');
        }

    } catch (error) {
      console.error('Erreur :\nUne erreur est survenue.\nVeuillez réessayer:', error);
      alert('Erreur :\nUne erreur est survenue.\nVeuillez réessayer.');
    }
  }


  resetSupplierForm() {
    this.SelectedSupplier = {
      name: '',
      email: '',
      matricule_fiscale: '',
      adress: '',
      dateDeContrat:null,
      RIB: null
    };
  }


  async updateSupplier(): Promise<void> {
    try {


        if (this.selectedSupplier) {
          this.supplierService.updateSupplier(this.selectedSupplier.id, this.selectedSupplier).subscribe(
            (data) => {
              console.log('client updated successfully:', data);
              alert('client updated successfully!');
              this.toggleShowInfoSupplierDiv();
              this.loadSuppliers();
            },
            (error) => {
              console.error('Erreur lors de la mise à jour du client:', error);
              alert('Erreur lors de la mise à jour du client. Veuillez réessayer.');
            }
          );
        }

    } catch (error) {
      console.error('Erreur :\nUne erreur est survenue.\nVeuillez réessayer:', error);
      alert('Erreur :\nUne erreur est survenue.\nVeuillez réessayer.');
    }
  }

  async deleteSupplier(): Promise<void> {
    try {


        if (this.selectedSupplier) {
          if (confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
            this.supplierService.deleteSupplier(this.selectedSupplier.id).subscribe(
              (data) => {
                console.log('client supprimé avec succès:', data);
                alert('client supprimé avec succès!');
                this.toggleShowInfoSupplierDiv();
                this.loadSuppliers();
              },
              (error) => {
                console.error('Erreur lors de la suppression du client:', error);
                alert('Erreur lors de la suppression du client. Veuillez réessayer.');
              }
            );
          }
        }

    } catch (error) {
      console.error('Erreur :\nUne erreur est survenue.\nVeuillez réessayer:', error);
      alert('Erreur :\nUne erreur est survenue.\nVeuillez réessayer.');
    }
  }

  loadSuppliers(): void {
    this.supplierService.getSuppliers().subscribe(
      (data) => {
        this.suppliers = data;
      },
      (error) => {
        console.error('Erreur lors de la récupération des clients:', error);
      }
    );
  }

  viewClients(supplierId: number): void {

    this.selectedSupplierId = supplierId;
    this.viewSupplierName(supplierId);
    this.supplierService.getClientsBySupplierId(supplierId).subscribe(
      (data) => {
        this.clients = data;
      },
      (error: any) => {
        console.error('Erreur lors de la récupération des grossiste:', error);
      }
    );
    this.scrollToReports();
  }

  viewSupplierName(supplierId: number): void {
    this.selectedSupplierId = supplierId;

    this.supplierService.getSupplierById(supplierId).subscribe(
      (data) => {
        this.selectedSupplier = data;
      },
      (error) => {
        console.error('Erreur lors de la récupération des détails du client:', error);
      }
    );
  }

  viewClientDetails(clientId: number): void {
    this.supplierService.getClientById(clientId).subscribe(
      (data) => {
        this.selectedClient = data;
        this.toggleShowInfoClientrDiv();
      },
      (error) => {
        console.error('Erreur lors de la récupération des informations du grossiste:', error);
      }
    );
  }

  toggleInfoClientDiv(): void {
    this.showClientInfoDiv = !this.showClientInfoDiv;

  }
  toggleShowInfoClientrDiv(): void {
    this.toggleInfoClientDiv();
    this.showInfoClientInfoDiv = !this.showInfoClientInfoDiv;
  }

  async toggleShowInfoClientrDivclose(): Promise<void> {
    // 1. First execute the payment chart close function immediately
    this.showClientPaymentChartclose();

    // 2. Wait for 2 seconds
    await new Promise(resolve => setTimeout(resolve, 100));

    // 3. Then execute the original toggle functionality
    this.toggleInfoClientDiv();
    this.showInfoClientInfoDiv = !this.showInfoClientInfoDiv;
  }
  toggleShowAddClientDiv(): void {
    this.toggleInfoClientDiv();
    this.showAddClientInfoDiv = !this.showAddClientInfoDiv;
  }

  async addClient(): Promise<void> {
    try {


        if (this.SelectedClient.name && this.SelectedClient.email && this.selectedSupplierId) {
          this.supplierService.addClientToSupplier(this.selectedSupplierId, this.SelectedClient).subscribe(
            (data) => {
              console.log('Grossiste ajouté avec succès:', data);
              alert('Grossiste ajouté avec succès!');
              this.toggleShowAddClientDiv();
              this.SelectedClient = { name: '', email: '' };

              if (this.selectedSupplierId !== null) {
                this.loadClients(this.selectedSupplierId);
              }
            },
            (error) => {
              console.error('Erreur lors de l\'ajout du Grossiste:', error);
              alert('Erreur lors de l\'ajout du Grossiste:');
            }
          );
        } else {
          alert('Veuillez remplir tous les champs et vous assurer qu\'un client est sélectionné.');
        }

    } catch (error) {
      console.error('Erreur :\nUne erreur est survenue.\nVeuillez réessayer:', error);
      alert('Erreur :\nUne erreur est survenue.\nVeuillez réessayer.');
    }
  }


  async updateClient(): Promise<void> {
    try {


        if (this.selectedClient) {
          this.supplierService.updateClient(this.selectedClient.id, this.selectedClient).subscribe(
            (data) => {
              console.log('Grossiste mis à jour avec succès:', data);
              alert('Grossiste mis à jour avec succès!');
              this.toggleShowInfoClientrDiv();

              if (this.selectedSupplierId !== null) {
                this.loadClients(this.selectedSupplierId);
              }
            },
            (error) => {
              console.log('Grossiste à mettre à jour:', this.selectedClient);
              console.error('Erreur lors de la mise à jour du Grossiste:', error);
              alert('Erreur lors de la mise à jour du Grossiste. Veuillez réessayer.');
              console.error('Détails de l\'erreur:', error.message, error.status, error.error);
            }
          );
        }

    } catch (error) {
      console.error('Erreur :\nUne erreur est survenue.\nVeuillez réessayer:', error);
      alert('Erreur :\nUne erreur est survenue.\nVeuillez réessayer.');
    }
  }

  async deleteClient(): Promise<void> {
    try {

        if (this.selectedClient) {
          if (confirm('Êtes-vous sûr de vouloir supprimer ce Grossiste ?')) {
            console.log('Deleting client with ID:', this.selectedClient.id);
            this.supplierService.deleteClient(this.selectedClient.id).subscribe(
              (data) => {
                console.log('Grossiste supprimé avec succès:', data);
                alert('Grossiste supprimé avec succès!');
                this.toggleShowInfoClientrDiv();

                if (this.selectedSupplierId !== null) {
                  this.loadClients(this.selectedSupplierId);
                }
              },
              (error) => {
                console.error('Erreur lors de la suppression du Grossiste:', error);
                console.error('Détails de l\'erreur:', error.message, error.status, error.statusText);
                alert('Erreur lors de la suppression du Grossiste. Veuillez réessayer.');
              }
            );
          }
        } else {
          console.error('Aucun Grossiste sélectionné pour la suppression.');
        }

    } catch (error) {
      console.error('Erreur :\nUne erreur est survenue.\nVeuillez réessayer:', error);
      alert('Erreur :\nUne erreur est survenue.\nVeuillez réessayer.');
    }
  }

  loadClients(supplierId: number): void {
    this.supplierService.getClientsBySupplierId(supplierId).subscribe(
      (data) => {
        this.clients = data;
      },
      (error) => {
        console.error('Erreur lors de la récupération des Grossistes:', error);
      }
    );
  }

  async generateInvoiceclient(clientId: number): Promise<void> {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const selection = window.prompt(
      `Sélectionnez la plage de mois (entrez deux chiffres):\n\n` +
      months.map((m, i) => `${i+1}. ${m}`).join('  ') +
      `\n\nExemple: "3 5" pour mars-mai`
    );

    if (selection === null) return;

    const [startNum, endNum] = selection.split(' ').map(Number);
    if (!startNum || !endNum || startNum > endNum || startNum < 1 || endNum > 12) {
      alert('Sélection non valide. Veuillez saisir deux nombres dans l\'ordre (exemple: "3 5")');
      return;
    }

    const moinsX = months[startNum-1].toLowerCase().substring(0, 3);
    const moinsY = months[endNum-1].toLowerCase().substring(0, 3);

    const rsInput = prompt('Entrez le pourcentage RS (par défaut: 1%):', '1');
    if (rsInput === null) return;
    const rsPercentage = rsInput ? parseFloat(rsInput) : 1;

    const tvaInput = prompt('Entrez le pourcentage de TVA (par défaut: 19%):', '19');
    if (tvaInput === null) return;
    const tvaPercentage = tvaInput ? parseFloat(tvaInput) : 19;

    if (isNaN(rsPercentage) || isNaN(tvaPercentage)) {
      alert('Veuillez saisir des nombres valides pour les pourcentages');
      return;
    }

    this.supplierService.generateClientPdf(
      clientId,
      moinsX,
      moinsY,
      rsPercentage,
      tvaPercentage
    ).subscribe(
      (pdfBlob: Blob) => {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(pdfBlob);
        link.download = `invoice_${moinsX}_to_${moinsY}_rs${rsPercentage}_tva${tvaPercentage}.pdf`;
        link.click();
      },
      (error) => {
        console.error('Erreur lors de la génération du PDF:', error);
        alert('La génération PDF a échoué');
      }
    );
  }
  async generateInvoice(supplierId: number): Promise<void> {
    try {
      const quarterChoice = await this.promptForQuarter();

      if (quarterChoice === null) {
        return;
      }

      this.supplierService.generatePdf(supplierId, quarterChoice).subscribe(
        (pdfBlob: Blob) => {
          const link = document.createElement('a');
          link.href = window.URL.createObjectURL(pdfBlob);
          link.download = `supplier_${supplierId}_invoice.pdf`;
          link.click();
        },
        (error) => {
          console.error('La génération PDF a échoué:', error);
          alert('La génération PDF a échoué');
        }
      );
    } catch (error) {
      console.error('Erreur dans la sélection du trimestre:', error);
      alert('La génération PDF a échoué \nTrimestres non valides: utilisez un format comme  "1+2","1+2+3" nombres entre 1 et 4');
    }
  }

  private async promptForQuarter(): Promise<string | null> {
    const result = prompt(
      'Choisissez le(s) trimestre(s):\n' +
      '1. Automatiquement (trimestre en cours)\n' +
      '2. Enter quarter(s) manually (par exemple, 1 or 1+2 or 1+2+3+4)\n\n' +
      'Entrez votre choix (numéros 1 ou quart):'
    );

    // Handle cancel - now returns null explicitly
    if (result === null) {
      return null; // This signals cancellation
    }

    // Handle empty input (user clicked OK with no input)
    if (result.trim() === '') {
      return 'auto'; // Default to automatic
    }

    // Validate manual input
    const quarters = result.split('+').map(q => q.trim());
    const validQuarters = quarters.every(q => ['1', '2', '3', '4'].includes(q));

    if (!validQuarters) {
      throw new Error('Invalid quarter selection. Please enter numbers between 1-4 separated by +');
    }

    return quarters.join('+');
  }


  loadSolutions(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.supplierService.getSolutions().subscribe({
      next: (data) => {
        this.solutions = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Échec du chargement des solutions. Veuillez réessayer ultérieurement.';
        this.isLoading = false;
        console.error('Erreur lors du chargement des solutions:', err);
      }
    });
  }

  addSolutionToSupplier(solutionId: number) {
    if (!this.selectedSupplierId) {
      alert('Veuillez d\'abord sélectionner un Client');
      return;
    }

    this.supplierService.addSolutionToSupplier(this.selectedSupplierId, solutionId)
      .subscribe({
        next: () => {
          alert('Solution ajoutée avec succès!');
          // Optional: Add any logic to refresh your data here
        },
        error: (err) => {
          alert(`Error: ${err.message}`);
        }
      });
  }
  // Toggle solution panel visibility

  supplierSolutions: Solution[] = [];
  showSolutionsDropdown = false;
  new: any;

  loadSupplierSolutions(): void {
    if (!this.selectedSupplierId) return;

    this.supplierService.getSupplierSolutions(this.selectedSupplierId)
      .subscribe({
        next: (solutions) => {
          this.supplierSolutions = solutions;
        },
        error: (err) => {
          console.error('Erreur lors du chargement des solutions:', err);
          alert('Échec du chargement des solutions');
        }
      });
  }

  toggleSolutionsDropdown(): void {
    if (!this.showSolutionsDropdown) {
      this.loadSupplierSolutions();
    }
    this.showSolutionsDropdown = !this.showSolutionsDropdown;
  }

  removeSolution(solutionId: number): void {
    if (!this.selectedSupplierId) {
      alert('Aucun Client sélectionné');
      return;
    }

    if (confirm('Êtes-vous sûr de vouloir supprimer cette solution ?')) {
      this.supplierService.removeSolutionFromSupplier(this.selectedSupplierId, solutionId)
        .subscribe({
          next: () => {
            // Remove from local array for immediate UI update
            this.supplierSolutions = this.supplierSolutions.filter(
              solution => solution.id !== solutionId
            );
            alert('Solution supprimée avec succès');
          },
          error: (err) => {
            console.error('Solution de suppression d\'erreur:', err);
            alert('Échec de la suppression de la solution: ' + err.message);
          }
        });
    }
  }
  // In your component class (replace the existing methods with these)

// Load all available solutions
  loadAllAvailableSolutions(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.supplierService.getSolutions().subscribe({
      next: (data) => {
        this.solutions = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load solutions. Please try again later.';
        this.isLoading = false;
        console.error('Error loading solutions:', err);
      }
    });
  }

// Associate a solution with the selected supplier
  associateSolutionWithSupplier(solutionId: number) {
    if (!this.selectedSupplierId) {
      alert('Please select a supplier first');
      return;
    }

    this.supplierService.addSolutionToSupplier(this.selectedSupplierId, solutionId)
      .subscribe({
        next: () => {
          alert('Solution associated successfully!');
          this.loadSupplierAssociatedSolutions(); // Refresh the list
        },
        error: (err) => {
          alert(`Error: ${err.message}`);
        }
      });
  }

// Load solutions associated with current supplier
  loadSupplierAssociatedSolutions(): void {
    if (!this.selectedSupplierId) return;

    this.supplierService.getSupplierSolutions(this.selectedSupplierId)
      .subscribe({
        next: (solutions) => {
          this.supplierSolutions = solutions;
        },
        error: (err) => {
          console.error('Error loading supplier solutions:', err);
          alert('Failed to load supplier solutions');
        }
      });
  }

// Remove association between solution and supplier
  removeSolutionAssociation(solutionId: number): void {
    if (!this.selectedSupplierId) {
      alert('No supplier selected');
      return;
    }

    if (confirm('Are you sure you want to remove this solution association?')) {
      this.supplierService.removeSolutionFromSupplier(this.selectedSupplierId, solutionId)
        .subscribe({
          next: () => {
            this.supplierSolutions = this.supplierSolutions.filter(
              solution => solution.id !== solutionId
            );
            alert('Solution association removed successfully');
          },
          error: (err) => {
            console.error('Error removing solution:', err);
            alert('Failed to remove solution association: ' + err.message);
          }
        });
    }
  }

// Get solutions not associated with current supplier
  getAvailableSolutionsForSupplier(): Solution[] {
    if (!this.solutions) return [];
    if (!this.selectedSupplierId || !this.supplierSolutions || this.supplierSolutions.length === 0) {
      return this.solutions;
    }

    return this.solutions.filter(solution =>
      !this.supplierSolutions.some(linkedSolution => linkedSolution.id === solution.id)
    );
  }
  // In your component class
  getDisplayRows(): any[] {
    // Create array with actual suppliers + empty objects to reach 6 items
    return [
      ...this.suppliers,
      ...Array(Math.max(0, 6 - this.suppliers.length)).fill({})
    ];
  }


  // Add this method to show/hide the chart
  showSupplierPaymentChart(): void {
    this.showSupplierPaymentChartDiv = !this.showSupplierPaymentChartDiv;

    if (this.showSupplierPaymentChartDiv && this.selectedSupplier) {
      this.initializeAvailableYears(); // Initialize years
      this.supplierSelectedYear = new Date().getFullYear(); // Set default to current year
      this.loadSupplierFactures(this.selectedSupplier.id);
    } else {
      this.destroySupplierPaymentChart();
    }
  }

// Add this method to load supplier factures
  loadSupplierFactures(supplierId: number): void {
    // Get paid factures
    this.supplierService.getPaidFacturesBySupplier(supplierId).subscribe({
      next: (factures) => {
        this.originalPaidFacturesForSupplier = factures;

        // Get unpaid factures
        this.supplierService.getUnpaidFacturesBySupplier(supplierId).subscribe({
          next: (unpaidFactures) => {
            this.originalUnpaidFacturesForSupplier = unpaidFactures;
            this.filterSupplierFacturesByYear(); // Apply year filter initially
          },
          error: (err) => console.error('Error loading unpaid factures:', err)
        });
      },
      error: (err) => console.error('Error loading paid factures:', err)
    });
  }
  // Add these new methods for year filtering
  filterSupplierFacturesByYear(): void {
    if (!this.supplierSelectedYear) return;

    const targetYear = Number(this.supplierSelectedYear);

    // Filter both paid and unpaid factures
    this.paidFacturesForSupplier = this.originalPaidFacturesForSupplier.filter(f => {
      if (!f.dateCreation) return false;
      const date = new Date(f.dateCreation);
      return date.getUTCFullYear() === targetYear;
    });

    this.unpaidFacturesForSupplier = this.originalUnpaidFacturesForSupplier.filter(f => {
      if (!f.dateCreation) return false;
      const date = new Date(f.dateCreation);
      return date.getFullYear() === targetYear;
    });

    // Update the chart
    this.createSupplierPaymentChart();
  }

  resetSupplierYearFilter(): void {
    this.supplierSelectedYear = new Date().getFullYear();
    this.filterSupplierFacturesByYear();
  }

// Add this method to create the chart
  createSupplierPaymentChart(): void {
    this.destroySupplierPaymentChart();

    const ctx = document.getElementById('supplierPaymentChart') as HTMLCanvasElement;
    if (!ctx) return;

    this.supplierPaymentChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Payé', 'Non payé'],
        datasets: [{
          data: [
            this.paidFacturesForSupplier.length,
            this.unpaidFacturesForSupplier.length
          ],
          backgroundColor: ['#4CAF50', '#F44336'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `Statut de paiement - ${this.supplierSelectedYear}`
          },
          legend: {
            position: 'top',
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
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
// Add this method to clean up the chart
  destroySupplierPaymentChart(): void {
    if (this.supplierPaymentChart) {
      this.supplierPaymentChart.destroy();
      this.supplierPaymentChart = null;
    }
  }
  initializeAvailableYears(): void {
    const currentYear = new Date().getFullYear();
    this.availableYears = Array.from(
      { length: currentYear }, // Creates an array from currentYear down to 1
      (_, index) => currentYear - index
    );
  }





  // Add these methods
  showClientPaymentChart(): void {
    this.showClientPaymentChartDiv = !this.showClientPaymentChartDiv;

    if (this.showClientPaymentChartDiv && this.selectedClient) {
      this.initializeAvailableYears(); // Make sure this is called
      this.clientSelectedYear = new Date().getFullYear();
      this.loadClientBonDeCommandes(this.selectedClient.name);
    } else {
      this.destroyClientPaymentChart();
    }
  }
  showClientPaymentChartclose(): void {
    this.showClientPaymentChartDiv = false;

    if (this.showClientPaymentChartDiv && this.selectedClient) {
      this.initializeAvailableYears(); // Make sure this is called
      this.clientSelectedYear = new Date().getFullYear();
      this.loadClientBonDeCommandes(this.selectedClient.name);
    } else {
      this.destroyClientPaymentChart();
    }
  }

  loadClientBonDeCommandes(clientName: string): void {
    // Get paid bon de commandes
    this.supplierService.getPaidBonDeCommandesByClient(clientName).subscribe({
      next: (commandes) => {
        this.originalPaidBonDeCommandesForClient = commandes;

        // Get unpaid bon de commandes
        this.supplierService.getUnpaidBonDeCommandesByClient(clientName).subscribe({
          next: (unpaidCommandes) => {
            this.originalUnpaidBonDeCommandesForClient = unpaidCommandes;
            this.filterClientCommandesByYear();
          },
          error: (err) => console.error('Error loading unpaid bon de commandes:', err)
        });
      },
      error: (err) => console.error('Error loading paid bon de commandes:', err)
    });
  }

  filterClientCommandesByYear(): void {
    if (!this.clientSelectedYear) return;

    const targetYear = Number(this.clientSelectedYear);

    this.paidBonDeCommandesForClient = this.originalPaidBonDeCommandesForClient.filter(c => {
      if (!c.dateCreation) return false;
      const date = new Date(c.dateCreation);
      return date.getUTCFullYear() === targetYear;
    });

    this.unpaidBonDeCommandesForClient = this.originalUnpaidBonDeCommandesForClient.filter(c => {
      if (!c.dateCreation) return false;
      const date = new Date(c.dateCreation);
      return date.getUTCFullYear() === targetYear;
    });

    this.createClientPaymentChart();
  }

  resetClientYearFilter(): void {
    this.clientSelectedYear = new Date().getFullYear();
    this.filterClientCommandesByYear();
  }

  createClientPaymentChart(): void {
    this.destroyClientPaymentChart();

    const ctx = document.getElementById('clientPaymentChart') as HTMLCanvasElement;
    if (!ctx) return;

    this.clientPaymentChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Payé', 'Non payé'],
        datasets: [{
          data: [
            this.paidBonDeCommandesForClient.length,
            this.unpaidBonDeCommandesForClient.length
          ],
          backgroundColor: ['#4CAF50', '#F44336'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `Statut des bons de commande - ${this.clientSelectedYear}`
          },
          legend: {
            position: 'top',
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
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

  destroyClientPaymentChart(): void {
    if (this.clientPaymentChart) {
      this.clientPaymentChart.destroy();
      this.clientPaymentChart = null;
    }
  }

  exportSupplierExcel() {
    if (this.selectedSupplier?.id) {
      this.supplierService.exportSupplierToExcel(this.selectedSupplier.id).subscribe(
        () => {
          // Optional: Add success notification
          console.log('Export successful');
        },
        (error) => {
          // Optional: Add error notification
          console.error('Export failed:', error);
        }
      );
    }
  }

  protected readonly Object = Object;


  async viewExportlatest(exportItem?: any, type: 'database' | 'supplier' = 'database'): Promise<void> {
    this.isLoadingExcel = true;
    this.excelModalVisible = true;

    try {
      let targetExport = exportItem;

      // If no exportItem provided, fetch the latest one
      if (!targetExport) {
        targetExport = await this.getLatestExport();
      }

      this.currentExport = targetExport;

      const byteCharacters = atob(targetExport.fileContent);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);

      // Parse and store the workbook
      this.workbook = new ExcelJS.Workbook();
      await this.workbook.xlsx.load(byteArray);

      // Handle multiple sheets
      if (this.workbook.worksheets.length > 1) {
        this.showSheetSelector(this.workbook);
      } else {
        const firstSheet = this.workbook.worksheets[0];
        if (firstSheet) {
          this.processWorksheet(firstSheet, targetExport.fileName);
        }
      }
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      this.toastr.error('Could not parse Excel file, downloading instead');
      if (this.currentExport) {
        this.downloadExcel(this.currentExport);
      }
      this.excelModalVisible = false;
    } finally {
      this.isLoadingExcel = false;
    }
  }
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

      // Parse and store the workbook
      this.workbook = new ExcelJS.Workbook();
      await this.workbook.xlsx.load(byteArray);

      // Handle multiple sheets
      if (this.workbook.worksheets.length > 1) {
        this.showSheetSelector(this.workbook); // Pass the workbook
      } else {
        const firstSheet = this.workbook.worksheets[0];
        if (firstSheet) {
          this.processWorksheet(firstSheet, exportItem.fileName);
        }
      }
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      this.toastr.error('Could not parse Excel file, downloading instead');
      this.downloadExcel(exportItem);
      this.excelModalVisible = false;
    } finally {
      this.isLoadingExcel = false;
    }
  }
// New helper method to process a single worksheet
  private processWorksheet(worksheet: ExcelJS.Worksheet, fileName: string): void {
    // Get actual column count by checking the first row
    const firstRow = worksheet.getRow(1);
    const colCount = firstRow.actualCellCount;

    // Extract headers (keep empty if no header text)
    const headers = [];
    if (worksheet.rowCount > 0) {
      for (let col = 1; col <= colCount; col++) {
        const cell = firstRow.getCell(col);
        headers.push(cell.text || '');
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
      fileName: fileName,
      sheetName: worksheet.name
    };
  }

// Option 1: Show sheet selector to user
  public showSheetSelector(workbook?: ExcelJS.Workbook): void {
    // Use the stored workbook if none provided
    const targetWorkbook = workbook || this.workbook;
    if (!targetWorkbook) return;

    this.excelData = {
      multipleSheets: true,
      sheets: targetWorkbook.worksheets.map(sheet => ({
        name: sheet.name,
        index: sheet.id
      })),
      fileName: this.currentExport?.fileName || 'Export'
    };
    this.isLoadingExcel = false;
  }
// Add this property to your component class
  private workbook?: ExcelJS.Workbook;
// Call this when user selects a sheet
  // Update your onSheetSelected method with proper type checking
  public onSheetSelected(sheetId: number): void {
    // You'll need to have stored the workbook reference or re-parse it
    const selectedSheet = this.workbook?.getWorksheet(sheetId);

    if (!selectedSheet) {
      this.toastr.error('Selected sheet not found');
      return;
    }

    this.processWorksheet(selectedSheet, this.currentExport.fileName);
  }

  downloadCurrentExcel(): void {
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
// Add this method to your component class
  public backToSheetSelection(): void {
    if (this.workbook) {
      this.showSheetSelector(this.workbook);
    }
  }

  private async getLatestExport(): Promise<any> {
    try {
      // Assuming you have a service method to get the latest export
      const latestExport = await this.supplierService.getLatest().toPromise();

      if (!latestExport) {
        throw new Error('No export files found');
      }

      return latestExport;
    } catch (error) {
      console.error('Error fetching latest export:', error);
      this.toastr.error('Could not fetch the latest export file');
      throw error;
    }
  }

// You'll also need to add this service method if you don't have it
// In your service file:
  /*
  getLatest(): Observable<any> {
    return this.http.get(`${this.apiUrl}/export-history/latest`);
  }
  */
  async deleteLatestExport(): Promise<void> {
    try {
      // First get the latest export to get its ID
      const latestExport = await this.getLatestExport();

      if (!latestExport) {
        this.toastr.warning('No export files found to delete');
        return;
      }

      // Confirm deletion
      const confirmDelete = confirm(`Are you sure you want to delete the latest export: ${latestExport.fileName}?`);

      if (confirmDelete) {
        // Use the existing delete endpoint with the latest export ID
        await this.supplierService.deleteExport(latestExport.id).toPromise();
        this.toastr.success('Latest export deleted successfully');

      }
    } catch (error) {
      console.error('Error deleting latest export:', error);
      this.toastr.error('Could not delete the latest export');
    }
  }
  handleExportAndView_DB() {
    this.isExporting = true;

    // First, execute the export
    this.exportToExcel();

    // Then, automatically call X after 2 seconds
    setTimeout(() => {
      this.viewExportlatest();
      this.isExporting = false;
    }, 100);
  }
  handleExportAndView_SP() {
    // First, execute the export
    this.exportSupplierExcel();
    // Then, automatically call X after 2 seconds
    setTimeout(() => {
      this.viewExportlatest();
    }, 100);
  }


  async closeExcelModal_without_saving_file() {
    try {
      const latestExport = await this.getLatestExport();

      if (!latestExport) {
        this.toastr.warning('No export files found to delete');
        return;
      }

      // Use the same confirmation logic as deleteLatestExport
      const confirmDelete = confirm(`Le fichier ne sera pas enregistré dans la base de données. Si vous souhaitez l’enregistrer, cliquez sur le bouton « Sauvegarder ».`);

      if (confirmDelete) {
        // Perform the deletion
        await this.supplierService.deleteExport(latestExport.id).toPromise();
        this.toastr.success('Latest export deleted successfully');

        // Close modal after 2 seconds
        setTimeout(() => {
          this.closeExcelModal();
        }, 100);
      }
    } catch (error) {
      console.error('Error:', error);
      this.toastr.error('Could not delete the latest export');
    }
  }
}
