package com.example.backend.Services;

import com.example.backend.Entity.Client;
import com.example.backend.Entity.Solution;
import com.example.backend.Entity.Supplier;
import com.example.backend.Repositories.ClientRepository;
import com.example.backend.Repositories.SupplierRepository;
import com.example.backend.Repositories.SolutionRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;

import java.util.List;
import java.util.Optional;

@Service
public class SupplierService {

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private SolutionRepository solutionRepository;


    public List<Client> getClientsBySupplierId(Integer supplierId) {
        return clientRepository.findBySupplierId(supplierId);
    }

    public List<Supplier> getAllSuppliers() {
        return supplierRepository.findAll();
    }

    public Optional<Supplier> getSupplierById(Integer id) {
        return supplierRepository.findById(id);
    }

    public Supplier createSupplier(Supplier supplier) {
        return supplierRepository.save(supplier);
    }

    public Supplier updateSupplier(Integer id, Supplier supplierDetails) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Supplier not found"));
        supplier.setName(supplierDetails.getName());
        supplier.setEmail(supplierDetails.getEmail());
        supplier.setMatricule_fiscale(supplierDetails.getMatricule_fiscale());
        supplier.setAdress(supplierDetails.getAdress());
        supplier.setDateDeContrat(supplierDetails.getDateDeContrat());
        supplier.setRIB(supplierDetails.getRIB());
        return supplierRepository.save(supplier);
    }

    public Supplier saveSupplier(Supplier supplier) {
        return supplierRepository.save(supplier);
    }

    public void deleteSupplier(Integer id) {
        supplierRepository.deleteById(id);
    }

    public Client addClientToSupplier(Integer supplierId, Client client) {
        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new RuntimeException("Supplier not found"));

        client.setSupplier(supplier);
        return clientRepository.save(client);
    }


    public Supplier addSolutionToSupplier(Integer supplierId, Integer solutionId) {
        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new RuntimeException("Supplier not found"));

        Solution solution = solutionRepository.findById(solutionId)
                .orElseThrow(() -> new RuntimeException("Solution not found"));

        supplier.addSolution(solution);
        return supplierRepository.save(supplier);
    }

    @Transactional
    public Supplier removeSolutionFromSupplier(Integer supplierId, Integer solutionId) {
        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new RuntimeException("Supplier not found"));

        Solution solution = solutionRepository.findById(solutionId)
                .orElseThrow(() -> new RuntimeException("Solution not found"));

        supplier.removeSolution(solution);
        return supplierRepository.save(supplier);
    }

    public List<Solution> getSolutionsBySupplierId(Integer supplierId) {
        return supplierRepository.findById(supplierId)
                .map(Supplier::getSolutions)
                .map(ArrayList::new) // Convert Set to List if needed
                .orElseThrow(() -> new RuntimeException("Supplier not found with id: " + supplierId));
    }
}
