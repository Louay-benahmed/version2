import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import { NgIf, NgOptimizedImage } from '@angular/common';
import { Router } from '@angular/router';

import { SupplierService } from '../../supplier.service';
import {ClientExcelData, Solution, Supplier} from '../../models/supplier';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    FormsModule,
    NgIf,
    NgOptimizedImage,
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



  selectedSupplierId: number | null = null;

  isLoading = true;
  errorMessage = '';
  solutions: Solution[] = [];

  /////////////////////////////////////////////////////////////////////
  // Add these properties to your component
  showExcelDataDiv: boolean = false;
  showExcelDataInfoDiv: boolean = false;
  clientExcelData: ClientExcelData | null = null;

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

  fetchClientExcelData(): void {
    if (!this.selectedClient?.id) return;

    this.supplierService.getClientExcelData(this.selectedClient.id).subscribe({
      next: (data) => {
        console.log('Received Excel data from API:', data);

        // Create a new object with default values
        const mergedData = this.getEmptyExcelData();

        // Only proceed if data is an object
        if (data && typeof data === 'object') {
          // Only overwrite defaults with actual values from API (ignore null/undefined)
          Object.keys(data).forEach(key => {
            if (data[key] !== null && data[key] !== undefined) {
              mergedData[key] = data[key];
            }
          });
        }

        // Assign the merged data (this triggers change detection)
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

  constructor(private supplierService: SupplierService, private router: Router, private cd: ChangeDetectorRef) {}

  scrollToReports(): void {
    this.showClientDiv = true;

    setTimeout(() => {
      const element = document.getElementById('div_client');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 200);
  }

  toggleSolutionnDiv(): void {
    this.showSolutionDiv = !this.showSolutionDiv;
  }

  goToPage() {
    this.router.navigate(['/management']);
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
  toggleInfoSupplierDiv(): void {
    this.showSupplierDiv = !this.showSupplierDiv;
  }
  toggleShowInfoSupplierDiv(): void {
    this.toggleInfoSupplierDiv();
    this.showInfoSupplierDiv = !this.showInfoSupplierDiv;

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
  getDisplayRows() {
    // Always return an array of length 6
    return new Array(6).fill(0);
  }
}
