import {Component, OnInit} from '@angular/core';
import {Router, RouterModule} from '@angular/router';
import {CreateSolutionDto, Solution, Supplier} from '../../models/supplier';
import { SupplierService } from '../../supplier.service';
import { CommonModule } from '@angular/common';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-solution',
  standalone: true,
  templateUrl: './solution.component.html',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule
  ],
  styleUrl: './solution.component.css'
})
export class SolutionComponent implements OnInit {
  solutions: Solution[] = [];
  selectedSolution: Solution | null = null;
  editedSolution: Partial<Solution> = {};
  isEditing = false;
  isLoading = true;
  errorMessage = '';
  showSupplierDiv: boolean = false;
  showInfoSupplierDiv: boolean = false;
  showSolutionDiv: boolean = false;

  suppliers: Supplier[] = [];
  selectedSupplierNames: string[] = [];



  constructor(private supplierService: SupplierService, private router: Router) {}
  ngOnInit(): void {
    this.loadSolutions();
  }

  loadSuppliers(): void {
    this.supplierService.getSuppliers().subscribe({
      next: (data) => {
        this.suppliers = data;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des clients:', err);
      }
    });
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
        console.error('Échec du chargement des solutions:', err);
      }
    });
  }

  goToPage() {
    this.router.navigate(['/home']);
  }

  selectSolution(solution: Solution): void {
    this.selectedSolution = solution;
    this.editedSolution = { ...solution };
    this.isEditing = false;
  }

  startEditing(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.isEditing = true;
  }

  saveChanges(event?: MouseEvent): void {
    if (event) event.stopPropagation();

    if (!this.editedSolution || !this.selectedSolution?.id) {
      alert('Error: Aucune solution sélectionnée ou données manquantes!');
      this.isEditing = false;
      return;
    }

    const validationErrors = this.validateSolutionInputs(this.editedSolution);
    if (validationErrors.length > 0) {
      alert('Veuillez corriger ces erreurs:\n\n' + validationErrors.join('\n'));
      return;
    }

    const completeSolution: Solution = {
      id: this.selectedSolution.id,
      description: this.editedSolution.description!,
      prix: this.editedSolution.prix!,
      tax: this.editedSolution.tax!
    };

    this.supplierService.updateSolution(
      this.selectedSolution.id,
      completeSolution
    ).subscribe({
      next: (updatedSolution) => this.handleUpdateSuccess(updatedSolution),
      error: (err) => this.handleUpdateError(err)
    });
  }

  private validateSolutionInputs(solution: Partial<Solution>): string[] {
    const errors: string[] = [];

    // Validate description
    if (!solution.description || solution.description.trim().length === 0) {
      errors.push('• Une description est requise');
    } else if (solution.description.length > 255) {
      errors.push('• La description ne peut pas dépasser 255 caractères');
    }

    // Validate price
    if (solution.prix === null || solution.prix === undefined) {
      errors.push('• Le prix est obligatoire et il doit s\'agir d\'un numéro valide');
    } else if (isNaN(solution.prix)) {
      errors.push('• Le prix doit être un nombre valide');
    } else if (solution.prix < 0) {
      errors.push('• Le prix ne peut pas être négatif');
    }

    // Validate tax
    if (solution.tax === null || solution.tax === undefined) {
      errors.push('• La taxe est obligatoire');
    } else if (isNaN(solution.tax)) {
      errors.push('• La taxe doit être un numéro valide');
    } else if (solution.tax < 0) {
      errors.push('• La taxe ne peut pas être négative');
    } else if (solution.tax > 100) {
      errors.push('• L\'impôt ne peut pas dépasser 100 %');
    } else {
      // Check for more than 2 decimal places
      const decimalPart = solution.tax.toString().split('.')[1];
      if (decimalPart && decimalPart.length > 2) {
        errors.push('• La taxe peut avoir un maximum de 2 décimales');
      }
    }

    return errors;
  }

  private handleUpdateSuccess(updatedSolution: Solution): void {
    const index = this.solutions.findIndex(s => s.id === updatedSolution.id);
    if (index !== -1) {
      this.solutions[index] = updatedSolution;
    }

    this.selectedSolution = updatedSolution;
    this.isEditing = false;

    alert(`Solution mise à jour avec succès!\n\n` +
      `Description: ${updatedSolution.description}\n` +
      `Prix: ${updatedSolution.prix.toFixed(2)} €\n` +
      `Tax: ${updatedSolution.tax}%`);
  }

  private handleUpdateError(err: any): void {
    console.error('Erreur de mise à jour:', err);
    let errorMessage = 'Échec de la mise à jour de la solution';

    if (err.status === 404) {
      errorMessage = 'Solution non trouvée (peut avoir été supprimée)';
    } else if (err.status === 400) {
      errorMessage = 'La validation du serveur a échoué: ' +
        (err.error?.message || 'Format de données invalide');
    } else if (err.status === 0) {
      errorMessage = 'Erreur réseau - veuillez vérifier votre connexion';
    }

    alert(errorMessage);
    this.isEditing = true;
  }

  cancelEditing(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.isEditing = false;
    this.editedSolution = this.selectedSolution ? {...this.selectedSolution} : {};
  }

  deleteSolution(id: number, event?: MouseEvent): void {
    if (event) event.stopPropagation();

    if (confirm('Êtes-vous sûr de vouloir supprimer cette solution ?')) {
      this.supplierService.deleteSolution(id).subscribe({
        next: () => {
          this.solutions = this.solutions.filter(s => s.id !== id);
          if (this.selectedSolution?.id === id) {
            this.selectedSolution = null;
            this.editedSolution = {};
            this.isEditing = false;
          }
          alert('Solution supprimée avec succès!');
        },
        error: (err) => {
          if (err instanceof Error) {
            alert(err.message);
          }
          else if (err.status === 404) {
            alert('Solution non trouvée - elle a peut-être déjà été supprimée');
            this.loadSolutions();
          }
          else {
            alert('Erreur lors de la suppression de la solution. Veuillez réessayer.');
            console.error('Supprimer l\'erreur:', err);
          }
        }
      });
    }
  }

  isAddingNewSolution: boolean = false;
  newSolution: CreateSolutionDto = {
    description: '',
    prix: 0,
    tax: 0
  };



  startAddingNewSolution(): void {
    this.isAddingNewSolution = true;
    this.newSolution = {
      description: '',
      prix: 0,
      tax: 0
    };
    this.selectedSupplierNames = [];
    this.loadSuppliers();
    this.cancelEditing();
    this.selectedSolution = null;
  }

  cancelAddNewSolution(): void {
    this.isAddingNewSolution = false;
  }

  saveNewSolution(): void {
    if (!this.validateNewSolution()) return;

    const solutionToSend: CreateSolutionDto = {
      description: this.newSolution.description,
      prix: Number(this.newSolution.prix),
      tax: Number(this.newSolution.tax)
    };

    const supplierNames = this.selectedSupplierNames
      .filter(name => name && name.trim())
      .map(name => name.trim());

    console.log('Charge utile finale en cours d\'envoi:', {
      solution: solutionToSend,
      supplierNames: supplierNames
    });

    this.supplierService.createSolutionWithSuppliers(
      solutionToSend,
      supplierNames
    ).subscribe({
      next: (createdSolution) => {
        this.solutions.unshift(createdSolution);
        this.isAddingNewSolution = false;
        this.selectedSupplierNames = [];
        alert('Solution créée avec succès!');
      },
      error: (err) => {
        console.error('Erreur de création:', err);
        alert(`Error: ${err.message}`);
      }
    });
  }


  private validateNewSolution(): boolean {
    if (!this.newSolution.description || this.newSolution.description.trim() === '') {
      alert('Une description est requise');
      return false;
    }
    if (this.newSolution.prix === null || this.newSolution.prix === undefined || this.newSolution.prix < 0) {
      alert('Le prix doit être un nombre positif');
      return false;
    }
    if (this.newSolution.tax === null || this.newSolution.tax === undefined || this.newSolution.tax < 0 || this.newSolution.tax > 100) {
      alert('La taxe doit être comprise entre 0 et 100');
      return false;
    }
    return true;
  }

}
