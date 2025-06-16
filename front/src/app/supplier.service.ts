import { Injectable } from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders, HttpParams} from '@angular/common/http';
import {catchError, map, Observable, tap, throwError} from 'rxjs';
import {ClientExcelData, CreateSolutionDto, Solution, Supplier} from './models/supplier';

@Injectable({
  providedIn: 'root',
})
export class SupplierService {
  private apiUrl = 'http://localhost:8083/suppliers';
  private apiUrlClient = 'http://localhost:8083/clients';
  private apiUrlSolution = 'http://localhost:8083/api/solutions';
  private apiUrlfacture = 'http://localhost:8083/api/factures';
  private apiUrlbdc = 'http://localhost:8083/api/bon-de-commandes';


  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
    });
  }

  getSuppliers(): Observable<Supplier[]> {
    const headers = this.getHeaders();

    return this.http.get<Supplier[]>(this.apiUrl, { headers });
  }

  addSupplier(supplierData: any): Observable<any> {
    const headers = this.getHeaders(); // Get headers with token
    return this.http.post(this.apiUrl, supplierData, { headers });
  }

  getClientsBySupplierId(supplierId: number): Observable<any[]> {
    const headers = this.getHeaders();
    return this.http.get<any[]>(`http://localhost:8083/suppliers/${supplierId}/clients`, { headers });
  }

  getSupplierById(supplierId: number): Observable<any> {
    const headers = this.getHeaders();
    return this.http.get<any>(`http://localhost:8083/suppliers/${supplierId}`, { headers });
  }

  updateSupplier(supplierId: number, supplierData: any): Observable<any> {
    const headers = this.getHeaders();
    return this.http.put(`${this.apiUrl}/${supplierId}`, supplierData, { headers });
  }

  deleteSupplier(supplierId: number): Observable<any> {
    const headers = this.getHeaders();
    return this.http.delete(`${this.apiUrl}/${supplierId}`, { headers });
  }

  getClientById(clientId: number): Observable<any> {
    const headers = this.getHeaders();
    return this.http.get<any>(`${this.apiUrlClient}/${clientId}`, { headers });
  }

  updateClient(clientId: number, clientData: any): Observable<any> {
    const headers = this.getHeaders();
    return this.http.put(`${this.apiUrlClient}/${clientId}`, clientData, { headers });
  }

  deleteClient(clientId: number): Observable<any> {
    const headers = this.getHeaders();
    return this.http.delete(`${this.apiUrlClient}/${clientId}`, { headers });
  }

  addClientToSupplier(supplierId: number, clientData: any): Observable<any> {
    const headers = this.getHeaders();
    return this.http.post(`${this.apiUrl}/${supplierId}/clients`, clientData, { headers });
  }

  generatePdf(supplierId: number, quarterChoice: string = 'auto'): Observable<Blob> {
    const headers = this.getHeaders();
    return this.http.get(`${this.apiUrl}/generate-pdf/${supplierId}?quarter=${quarterChoice}`, {
      headers,
      responseType: 'blob',
    });
  }



  generateClientPdf(
    clientId: number,
    moinsX: string,
    moinsY: string,
    rsPercentage: number,
    tvaPercentage: number
  ): Observable<Blob> {
    const headers = this.getHeaders();
    const params = new HttpParams()
      .set('moinsX', moinsX)
      .set('moinsY', moinsY)
      .set('rs', rsPercentage.toString())
      .set('tva', tvaPercentage.toString());

    console.log('Sending params:', { rs: rsPercentage, tva: tvaPercentage });

    return this.http.get(`${this.apiUrlClient}/generate-pdf/${clientId}`, {
      headers,
      params,
      responseType: 'blob'
    });
  }




// ==================== SOLUTION METHODS ====================
  getSolutions(): Observable<Solution[]> {
    const headers = this.getHeaders();
    return this.http.get<Solution[]>(this.apiUrlSolution, { headers });
  }

  getSolutionById(id: number): Observable<Solution> {
    const headers = this.getHeaders();
    return this.http.get<Solution>(`${this.apiUrlSolution}/${id}`, { headers });
  }

  addSolution(solutionData: CreateSolutionDto): Observable<Solution> {
    const headers = this.getHeaders();
    return this.http.post<Solution>(this.apiUrlSolution, solutionData, { headers });
  }

  updateSolution(id: number, solutionData: Solution): Observable<Solution> {
    const headers = this.getHeaders();
    return this.http.put<Solution>(`${this.apiUrlSolution}/${id}`, solutionData, { headers });
  }

  deleteSolution(id: number): Observable<void> {
    const headers = this.getHeaders();
    return this.http.delete(`${this.apiUrlSolution}/${id}`, {
      headers,
      observe: 'response'
    }).pipe(
      map(response => {
        if (response.status === 204) {
          return;
        }
        throw response;
      }),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 409) {
          const errorMessage = error.error || 'Cannot delete solution - it is currently in use by one or more clients (laboratoires)';
          throw new Error(errorMessage);
        }
        throw error;
      })
    );
  }

  addSupplierToSolution(solutionId: number, supplierId: number): Observable<Solution> {
    const headers = this.getHeaders();
    return this.http.post<Solution>(
      `${this.apiUrlSolution}/${solutionId}/suppliers/${supplierId}`,
      null,
      { headers }
    );
  }

  addSolutionToSupplier(supplierId: number, solutionId: number): Observable<Supplier> {
    const headers = this.getHeaders();

    return this.http.post<Supplier>(
      `${this.apiUrl}/${supplierId}/solutions/${solutionId}`,
      {},
      { headers }
    ).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'Failed to add solution to supplier';

        if (error.status === 404) {
          errorMessage = error.error?.message || 'Supplier or solution not found';
        } else if (error.status === 400) {
          errorMessage = error.error?.message || 'Bad request - invalid data';
        } else if (error.status === 409) {
          errorMessage = error.error?.message || 'Solution is already associated with this supplier';
        } else if (error.error instanceof ErrorEvent) {
          // Client-side error
          errorMessage = `Error: ${error.error.message}`;
        } else {
          // Server-side error
          errorMessage = error.error?.message || errorMessage;
        }

        return throwError(() => new Error(errorMessage));
      })
    );
  }

  getSupplierSolutions(supplierId: number): Observable<Solution[]> {
    const headers = this.getHeaders();
    return this.http.get<Solution[]>(`${this.apiUrl}/${supplierId}/solutions`, { headers });
  }

  removeSolutionFromSupplier(supplierId: number, solutionId: number): Observable<void> {
    const headers = this.getHeaders();
    return this.http.delete<void>(
      `${this.apiUrl}/${supplierId}/solutions/${solutionId}`,
      { headers }
    );
  }

  createSolutionWithSuppliers(solution: CreateSolutionDto, supplierNames: string[]): Observable<Solution> {
    const payload = {
      solution: {
        description: solution.description,
        prix: solution.prix,
        tax: solution.tax
      },
      supplierNames: supplierNames
    };

    console.log('Sending payload:', payload);

    return this.http.post<Solution>(
      `${this.apiUrlSolution}/with-suppliers`,
      payload,
      {
        headers: this.getHeaders(),
        withCredentials: true
      }
    ).pipe(
      tap(response => console.log('Server response:', response)),
      catchError(error => {
        console.error('Error response:', error);
        let errorMessage = error.error?.message || 'Failed to create solution';
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  getAllFactures(): Observable<any[]> {
    const headers = this.getHeaders();
    return this.http.get<any[]>(`${this.apiUrlfacture}`, { headers });
  }

  getPaidFactures(): Observable<any[]> {
    const headers = this.getHeaders();
    return this.http.get<any[]>(`${this.apiUrlfacture}/factures/paid`, { headers });
  }

  getUnpaidFactures(): Observable<any[]> {
    const headers = this.getHeaders();
    return this.http.get<any[]>(`${this.apiUrlfacture}/factures/unpaid`, { headers });
  }

  sendFactureByEmail(document: string, recipientEmail: string): Observable<any> {
    const headers = this.getHeaders();
    const payload = {
      documentContent: document,
      recipientEmail: recipientEmail
    };

    return this.http.post(`${this.apiUrlfacture}/send-email`, payload, {
      headers,
      responseType: 'text'
    }).pipe(
      map(response => {
        return { message: response };
      }),
      catchError(error => {
        return throwError(() => ({
          message: error.error?.message || 'Failed to send email',
          status: error.status
        }));
      })
    );
  }

  getAllBonDeCommandes(): Observable<any[]> {
    const headers = this.getHeaders();
    return this.http.get<any[]>(`${this.apiUrlbdc}`, { headers });
  }

  getPaidBonDeCommandes(): Observable<any[]> {
    const headers = this.getHeaders();
    return this.http.get<any[]>(`${this.apiUrlbdc}/paid`, { headers });
  }

  getUnpaidBonDeCommandes(): Observable<any[]> {
    const headers = this.getHeaders();
    return this.http.get<any[]>(`${this.apiUrlbdc}/unpaid`, { headers });
  }

  sendBonDeCommandeByEmail(document: string, recipientEmail: string): Observable<any> {
    const headers = this.getHeaders();
    const payload = {
      documentContent: document,
      recipientEmail: recipientEmail
    };

    return this.http.post(`${this.apiUrlbdc}/send-email`, payload, {
      headers,
      responseType: 'text'
    }).pipe(
      map(response => {
        return { message: response };
      }),
      catchError(error => {
        return throwError(() => ({
          message: error.error?.message || 'Failed to send email',
          status: error.status
        }));
      })
    );
  }

  updateFacturePaymentStatus(factureId: number, paymentStatus: boolean): Observable<any> {
    const headers = this.getHeaders();
    return this.http.put(`${this.apiUrlfacture}/payment-status/${factureId}`,
      { payment: paymentStatus },
      { headers }
    );
  }

  updateBonDeCommandePaymentStatus(commandeId: number, paymentStatus: boolean): Observable<any> {
    const headers = this.getHeaders();
    return this.http.put(`${this.apiUrlbdc}/payment-status/${commandeId}`,
      { payment: paymentStatus },
      { headers }
    );
  }

  deleteFacture(factureId: number): Observable<any> {
    const headers = this.getHeaders();
    return this.http.delete(`${this.apiUrlfacture}/${factureId}`, { headers });
  }

  deleteBonDeCommande(commandeId: number): Observable<any> {
    const headers = this.getHeaders();
    return this.http.delete(`${this.apiUrlbdc}/${commandeId}`, { headers });
  }

// Add these methods to your SupplierService
  getClientExcelData(clientId: number): Observable<ClientExcelData> {
    const headers = this.getHeaders();
    return this.http.get<ClientExcelData>(`${this.apiUrlClient}/${clientId}/excel-data`, { headers });
  }

  updateClientExcelData(clientId: number, excelData: ClientExcelData): Observable<any> {
    const headers = this.getHeaders();
    return this.http.patch(`${this.apiUrlClient}/${clientId}/excel-data`, excelData, { headers });
  }

// Get paid invoices by supplier ID
  getPaidFacturesBySupplier(supplierId: number): Observable<any[]> {
    const headers = this.getHeaders();
    return this.http.get<any[]>(`${this.apiUrlfacture}/supplier/${supplierId}/paid`, { headers });
  }

// Get unpaid invoices by supplier ID
  getUnpaidFacturesBySupplier(supplierId: number): Observable<any[]> {
    const headers = this.getHeaders();
    return this.http.get<any[]>(`${this.apiUrlfacture}/supplier/${supplierId}/unpaid`, { headers });
  }

  // Get paid purchase orders by client name
  getPaidBonDeCommandesByClient(clientName: string): Observable<any[]> {
    const headers = this.getHeaders();
    return this.http.get<any[]>(`${this.apiUrlbdc}/client/${clientName}/paid`, { headers });
  }

// Get unpaid purchase orders by client name
  getUnpaidBonDeCommandesByClient(clientName: string): Observable<any[]> {
    const headers = this.getHeaders();
    return this.http.get<any[]>(`${this.apiUrlbdc}/client/${clientName}/unpaid`, { headers });
  }
}
