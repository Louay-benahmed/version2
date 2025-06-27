package com.example.backend.Controllers;

import com.example.backend.Entity.ExportHistory;
import com.example.backend.Entity.Supplier;
import com.example.backend.Repositories.SupplierRepository; // Add this import
import com.example.backend.Services.ExcelExportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import com.example.backend.Repositories.ExportHistoryRepository; // Add this import

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/export")
public class ExportController {

    @Autowired
    private ExcelExportService excelExportService;

    @Autowired
    private SupplierRepository supplierRepository; // Add repository

    @Autowired // Add this autowired repository
    private ExportHistoryRepository exportHistoryRepository;

    @GetMapping("/suppliers-excel")
    public ResponseEntity<byte[]> exportSuppliersToExcel() {
        try {
            List<Supplier> suppliers = supplierRepository.findAllWithClientsAndExcelData();

            if (suppliers.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.NO_CONTENT, "No suppliers available for export");
            }

            byte[] excelBytes = excelExportService.exportSuppliersToExcel(suppliers);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(new MediaType("application", "vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDisposition(
                    ContentDisposition.attachment()
                            .filename("suppliers_export_" + LocalDate.now() + ".xlsx", StandardCharsets.UTF_8)
                            .build()
            );

            return new ResponseEntity<>(excelBytes, headers, HttpStatus.OK);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error generating Excel file", e);
        }
    }

    // New endpoint for single supplier export
    @GetMapping("/supplier-excel/{supplierId}")
    public ResponseEntity<byte[]> exportSingleSupplierToExcel(@PathVariable Integer supplierId) {
        try {
            // Fetch the specific supplier with clients and excel data
            Supplier supplier = supplierRepository.findByIdWithClientsAndExcelData(supplierId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Supplier not found"));

            if (supplier.getClients().isEmpty()) {
                throw new ResponseStatusException(HttpStatus.NO_CONTENT, "No clients available for this supplier");
            }

            byte[] excelBytes = excelExportService.exportSingleSupplierToExcel(supplier);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(new MediaType("application", "vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDisposition(
                    ContentDisposition.attachment()
                            .filename(supplier.getName() + "_export_" + LocalDate.now() + ".xlsx", StandardCharsets.UTF_8)
                            .build()
            );

            return new ResponseEntity<>(excelBytes, headers, HttpStatus.OK);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error generating Excel file", e);
        }
    }

    @GetMapping("/history")
    public List<ExportHistory> getExportHistory() {
        return exportHistoryRepository.findAllByOrderByCreationDateDesc();
    }
    @GetMapping("/history/database-exports")
    public List<ExportHistory> getDatabaseExports() {
        return exportHistoryRepository.findByFileNameStartingWithOrderByCreationDateDesc(
                "Base de données exportée le"
        );
    }

    @GetMapping("/history/supplier-exports")
    public List<ExportHistory> getSupplierExports() {
        return exportHistoryRepository.findByFileNameNotStartingWithOrderByCreationDateDesc(
                "Base de données exportée le"
        );
    }
}