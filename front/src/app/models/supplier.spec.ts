import { Supplier } from './supplier';

describe('Supplier', () => {
  it('should create an instance', () => {
    const supplier: Supplier = {
      id: 1,
      name: 'Test Supplier',
      email: 'test@example.com',
      matricule_fiscale: 'Test Supplier matricule_fiscale',
      adress: 'Test Supplier adress',
      dateDeContrat: new Date(),
      RIB: 1234567890
    };

    expect(supplier).toBeTruthy();
  });
});
