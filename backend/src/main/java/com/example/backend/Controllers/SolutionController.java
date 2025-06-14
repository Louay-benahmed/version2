package com.example.backend.Controllers;

import com.example.backend.Entity.Solution;
import com.example.backend.Services.SolutionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/solutions")
public class SolutionController {

    @Autowired
    private SolutionService solutionService;

    @PostMapping
    public Solution createSolution(@RequestBody Solution solution) {
        return solutionService.createSolution(solution);
    }

    @GetMapping
    public List<Solution> getAllSolutions() {
        return solutionService.getAllSolutions();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Solution> getSolutionById(@PathVariable Integer id) {
        Optional<Solution> solution = solutionService.getSolutionById(id);
        return solution.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Solution> updateSolution(@PathVariable Integer id, @RequestBody Solution solutionDetails) {
        try {
            Solution updatedSolution = solutionService.updateSolution(id, solutionDetails);
            return ResponseEntity.ok(updatedSolution);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSolution(@PathVariable Integer id) {
        try {
            solutionService.deleteSolution(id);
            return ResponseEntity.noContent().build();
        } catch (EmptyResultDataAccessException e) {
            return ResponseEntity.notFound().build();
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Cannot delete solution - it is currently in use by one or more clients (laboratoires)");
        } catch (RuntimeException e) {
            return ResponseEntity.internalServerError()
                    .body("An error occurred while deleting the solution");
        }
    }

    @PostMapping("/with-suppliers")
    public ResponseEntity<?> createSolutionWithSuppliers(
            @RequestBody SolutionWithSuppliersRequest request) {

        try {
            Solution createdSolution = solutionService.createSolutionWithSuppliers(
                    request.getSolution(),
                    request.getSupplierNames());
            return ResponseEntity.ok(createdSolution);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    public static class SolutionWithSuppliersRequest {
        private Solution solution;
        private List<String> supplierNames;

        public Solution getSolution() { return solution; }
        public void setSolution(Solution solution) { this.solution = solution; }
        public List<String> getSupplierNames() { return supplierNames; }
        public void setSupplierNames(List<String> supplierNames) { this.supplierNames = supplierNames; }
    }


}