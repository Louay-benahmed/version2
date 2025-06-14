package com.example.backend.Controllers;

import com.example.backend.Entity.Client;
import com.example.backend.Entity.Solution;
import com.example.backend.Entity.Supplier;
import com.example.backend.Services.SupplierService;
import com.example.backend.Services.FileGenerationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/suppliers")
public class SupplierController {

    @Autowired
    private FileGenerationService fileGenerationService;

    @Autowired
    private SupplierService supplierService;

    @Autowired
    public SupplierController(FileGenerationService fileGenerationService,
                              SupplierService supplierService) {
        this.fileGenerationService = fileGenerationService;
        this.supplierService = supplierService;
    }


    @GetMapping
    public List<Supplier> getAllSuppliers() {
        return supplierService.getAllSuppliers();
    }

    @GetMapping("/{id}")
    public Supplier getSupplierById(@PathVariable Integer id) {
        return supplierService.getSupplierById(id).orElseThrow(() -> new RuntimeException("Supplier not found"));
    }

    @PostMapping
    public Supplier createSupplier(@RequestBody Supplier supplier) {
        return supplierService.createSupplier(supplier);
    }

    @PutMapping("/{id}")
    public Supplier updateSupplier(@PathVariable Integer id, @RequestBody Supplier supplierDetails) {
        return supplierService.updateSupplier(id, supplierDetails);
    }

    @DeleteMapping("/{id}")
    public void deleteSupplier(@PathVariable Integer id) {
        supplierService.deleteSupplier(id);
    }

    @GetMapping("/{supplierId}/clients")
    public List<Client> getClientsBySupplierId(@PathVariable Integer supplierId) {
        return supplierService.getClientsBySupplierId(supplierId);
    }

    @PostMapping("/{supplierId}/clients")
    public ResponseEntity<Client> addClientToSupplier(@PathVariable Integer supplierId, @RequestBody Client client) {
        Client newClient = supplierService.addClientToSupplier(supplierId, client);
        return ResponseEntity.status(HttpStatus.CREATED).body(newClient);
    }


    @GetMapping("/generate-pdf/{supplierId}")
    public ResponseEntity<ByteArrayResource> generatePdf(
            @PathVariable Integer supplierId,
            @RequestParam(required = false, defaultValue = "auto") String quarter
    ) {
        try {
            Supplier supplier = supplierService.getSupplierById(supplierId)
                    .orElseThrow(() -> new RuntimeException("Supplier not found with id: " + supplierId));

            Set<Solution> solutions = new HashSet<>(supplierService.getSolutionsBySupplierId(supplierId));
            supplier.setSolutions(solutions);

            byte[] pdfBytes = fileGenerationService.generatePdf(supplier, quarter);

            String quarterLabel = quarter.equals("auto")
                    ? String.valueOf(fileGenerationService.getCurrentQuarter())
                    : quarter;

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=supplier_details_" + supplierId + "_Q" + quarterLabel + ".pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(new ByteArrayResource(pdfBytes));

        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ByteArrayResource(e.getMessage().getBytes()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new ByteArrayResource("Error generating PDF".getBytes()));
        }
    }


    @PostMapping("/{supplierId}/solutions/{solutionId}")
    public Supplier addSolutionToSupplier(
            @PathVariable Integer supplierId,
            @PathVariable Integer solutionId) {
        return supplierService.addSolutionToSupplier(supplierId, solutionId);
    }
    @DeleteMapping("/{supplierId}/solutions/{solutionId}")
    public ResponseEntity<?> removeSolutionFromSupplier(
            @PathVariable Integer supplierId,
            @PathVariable Integer solutionId) {
        supplierService.removeSolutionFromSupplier(supplierId, solutionId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{supplierId}/solutions")
    public ResponseEntity<List<Solution>> getSupplierSolutions(
            @PathVariable Integer supplierId) {
        List<Solution> solutions = supplierService.getSolutionsBySupplierId(supplierId);
        return ResponseEntity.ok(solutions);
    }
}