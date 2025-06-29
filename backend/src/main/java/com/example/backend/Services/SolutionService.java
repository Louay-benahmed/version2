package com.example.backend.Services;


import com.example.backend.Entity.Solution;
import com.example.backend.Entity.Supplier;
import com.example.backend.Repositories.SolutionRepository;
import com.example.backend.Repositories.SupplierRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class SolutionService {

    @Autowired
    private SolutionRepository solutionRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    public Solution createSolution(Solution solution) {
        return solutionRepository.save(solution);
    }

    public List<Solution> getAllSolutions() {
        return solutionRepository.findAll();
    }

    public Optional<Solution> getSolutionById(Integer id) {
        return solutionRepository.findById(id);
    }

    public Solution updateSolution(Integer id, Solution solutionDetails) {
        Solution solution = solutionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Solution not found with id: " + id));

        solution.setDescription(solutionDetails.getDescription());
        solution.setPrix(solutionDetails.getPrix());
        solution.setTax(solutionDetails.getTax());

        return solutionRepository.save(solution);
    }

    public SolutionService(SolutionRepository solutionRepository) {
        this.solutionRepository = solutionRepository;
    }

    public void deleteSolution(Integer id) {
        try {
            solutionRepository.deleteById(id);
        } catch (EmptyResultDataAccessException e) {
            throw new RuntimeException("Solution not found with id: " + id);
        }
    }

    @Transactional
    public Solution createSolutionWithSuppliers(Solution solution, List<String> supplierNames)
            throws IllegalArgumentException {

        Solution savedSolution = solutionRepository.save(solution);

        if (supplierNames != null && !supplierNames.isEmpty()) {
            List<Supplier> suppliers = supplierRepository.findByNameIn(supplierNames);

            if (suppliers.size() != supplierNames.size()) {
                Set<String> foundNames = suppliers.stream()
                        .map(Supplier::getName)
                        .collect(Collectors.toSet());

                List<String> missing = supplierNames.stream()
                        .filter(name -> !foundNames.contains(name))
                        .collect(Collectors.toList());

                throw new IllegalArgumentException("Suppliers not found: " + missing);
            }

            suppliers.forEach(supplier -> {
                supplier.getSolutions().add(savedSolution);
            });
            savedSolution.getSuppliers().addAll(suppliers);
        }

        return solutionRepository.save(savedSolution);
    }


    public Solution updateSolutionPrix(Integer id, Float newPrix) {
        Solution solution = solutionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Solution not found with id: " + id));

        solution.setPrix(newPrix);
        return solutionRepository.save(solution);
    }
}
