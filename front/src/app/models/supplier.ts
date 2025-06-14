export interface Supplier {
  id: number;
  name: string;
  email: string;
  matricule_fiscale: string;
  adress: string;
  dateDeContrat: Date;
  RIB: number;
  clients?: Client[];
}

export interface Client {
  id: number;
  name: string;
  email: string;
  matricule_fiscale: string;
  adress: string;
  uniqueIdentifier: number;
  supplierId: number;
}
export interface Solution {
  id: number;
  description: string;
  prix: number;
  tax: number;
}

export interface CreateSolutionDto {
  description: string;
  prix: number;
  tax: number;
}

export interface SolutionWithSuppliersRequest {
  solution: CreateSolutionDto;
  supplierNames: string[];
}

export interface ClientExcelData {
  // Q1 (Jan-Mar)
  janStatus?: string;
  febStatus?: string;
  marStatus?: string;
  q1BcCount?: number;
  q1PaymentStatus?: string;
  q1Amount?: number;

  // Q2 (Apr-Jun)
  aprStatus?: string;
  mayStatus?: string;
  junStatus?: string;
  q2BcCount?: number;
  q2PaymentStatus?: string;
  q2Amount?: number;

  // Q3 (Jul-Sep)
  julStatus?: string;
  augStatus?: string;
  sepStatus?: string;
  q3BcCount?: number;
  q3PaymentStatus?: string;
  q3Amount?: number;

  // Q4 (Oct-Dec)
  octStatus?: string;
  novStatus?: string;
  decStatus?: string;
  q4BcCount?: number;
  q4PaymentStatus?: string;
  q4Amount?: number;

  // Financial data
  poids?: number;
  globalAmount?: number;
  annualPayment?: number;
  monthlyPayment?: number;

  [key: string]: any;

}

