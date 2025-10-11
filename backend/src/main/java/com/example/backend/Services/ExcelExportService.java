package com.example.backend.Services;

import com.example.backend.Entity.Client;
import com.example.backend.Entity.ClientExcelData;
import com.example.backend.Entity.ExportHistory;
import com.example.backend.Entity.Supplier;
import com.example.backend.Repositories.ExportHistoryRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

@Service
public class ExcelExportService {

    private final ExportHistoryRepository exportHistoryRepository;

    @Autowired
    public ExcelExportService(ExportHistoryRepository exportHistoryRepository) {
        this.exportHistoryRepository = exportHistoryRepository;
    }

    public byte[] exportSuppliersToExcel(List<Supplier> suppliers) throws IOException {
        if (suppliers == null || suppliers.isEmpty()) {
            throw new IllegalArgumentException("Supplier list cannot be null or empty");
        }

        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            // Create styles once
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dataStyle = createDataStyle(workbook);

            for (Supplier supplier : suppliers) {
                // Validate supplier has clients
                if (supplier.getClients() == null || supplier.getClients().isEmpty()) {
                    continue; // Skip suppliers without clients or create empty sheet
                }

                Sheet sheet = workbook.createSheet(sanitizeSheetName(supplier.getName()));

                // Create header row
                createHeaders(sheet.createRow(0), headerStyle);

                // Add client data
                int rowNum = 1;
                for (Client client : supplier.getClients()) {
                    Row row = sheet.createRow(rowNum++);
                    populateClientData(row, client, dataStyle);
                }

                // Auto-size columns
                for (int i = 0; i < 30; i++) {
                    sheet.autoSizeColumn(i);
                }
            }

            workbook.write(outputStream);
            byte[] excelBytes = outputStream.toByteArray();

            // Save export history
            String fileName = "Base de données exportée le" + LocalDate.now() + ".xlsx";
            saveExportHistory(fileName, excelBytes);

            return excelBytes;
        }
    }

    private String sanitizeSheetName(String name) {
        // Excel sheet names cannot exceed 31 chars or contain certain characters
        return name.replaceAll("[\\[\\]:*?/\\\\]", "").substring(0, Math.min(name.length(), 31));
    }
    private void createHeaders(Row headerRow, CellStyle style) {
        String[] headers = {
                "", // A: vide
                "Grossistes", // B
                "Poids", // C
                "Global Amount", // D
                "Annual Payment", // E
                "Monthly Paiement", // F
                "Jan", // G
                "Feb", // H
                "Mars", // I
                "BC on", // J (Q1)
                "Payment", // K (Q1)
                "Amount", // L (Q1)
                "Avril", // M
                "Mai", // N
                "Juin", // O
                "BC on", // P (Q2)
                "Payment", // Q (Q2)
                "Amount", // R (Q2)
                "Juillet", // S
                "Août", // T
                "Septembre", // U
                "BC on", // V (Q3)
                "Payment", // W (Q3)
                "Amount", // X (Q3)
                "Oct", // Y
                "Nov", // Z
                "Déc", // AA
                "BC on", // AB (Q4)
                "Payment", // AC (Q4)
                "Amount"  // AD (Q4)
        };

        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(style);
        }
    }

    private void populateClientData(Row row, Client client, CellStyle style) {
        ClientExcelData excelData = client.getExcelData();
        if (excelData == null) {
            excelData = new ClientExcelData();
        }

        // Column B: Grossistes (Client name)
        createCell(row, 1, client.getName(), style);

        // Column C: Poids
        createCell(row, 2, excelData.getPoids(), style);

        // Column D: Global Amount
        createCell(row, 3, excelData.getGlobalAmount(), style);

        // Column E: Annual Payment
        createCell(row, 4, excelData.getAnnualPayment(), style);

        // Column F: Monthly Paiement
        createCell(row, 5, excelData.getMonthlyPayment(), style);

        // Q1 Data (Jan-Mar)
        createCell(row, 6, excelData.getJanStatus(), style);  // G: Jan
        createCell(row, 7, excelData.getFebStatus(), style);  // H: Feb
        createCell(row, 8, excelData.getMarStatus(), style);  // I: Mar
        createCell(row, 9, excelData.getQ1BcCount(), style);  // J: BC on Q1
        createCell(row, 10, excelData.getQ1PaymentStatus(), style); // K: Payment Q1
        createCell(row, 11, excelData.getQ1Amount(), style); // L: Amount Q1

        // Q2 Data (Apr-Jun)
        createCell(row, 12, excelData.getAprStatus(), style);  // M: Apr
        createCell(row, 13, excelData.getMayStatus(), style);  // N: May
        createCell(row, 14, excelData.getJunStatus(), style);  // O: Jun
        createCell(row, 15, excelData.getQ2BcCount(), style);  // P: BC on Q2
        createCell(row, 16, excelData.getQ2PaymentStatus(), style); // Q: Payment Q2
        createCell(row, 17, excelData.getQ2Amount(), style); // R: Amount Q2

        // Q3 Data (Jul-Sep)
        createCell(row, 18, excelData.getJulStatus(), style);  // S: Jul
        createCell(row, 19, excelData.getAugStatus(), style);  // T: Aug
        createCell(row, 20, excelData.getSepStatus(), style);  // U: Sep
        createCell(row, 21, excelData.getQ3BcCount(), style);  // V: BC on Q3
        createCell(row, 22, excelData.getQ3PaymentStatus(), style); // W: Payment Q3
        createCell(row, 23, excelData.getQ3Amount(), style); // X: Amount Q3

        // Q4 Data (Oct-Dec)
        createCell(row, 24, excelData.getOctStatus(), style);  // Y: Oct
        createCell(row, 25, excelData.getNovStatus(), style);  // Z: Nov
        createCell(row, 26, excelData.getDecStatus(), style);  // AA: Dec
        createCell(row, 27, excelData.getQ4BcCount(), style);  // AB: BC on Q4
        createCell(row, 28, excelData.getQ4PaymentStatus(), style); // AC: Payment Q4
        createCell(row, 29, excelData.getQ4Amount(), style); // AD: Amount Q4
    }

    private void createCell(Row row, int column, String value, CellStyle style) {
        Cell cell = row.createCell(column);
        cell.setCellValue(value != null ? value : "");
        cell.setCellStyle(style);
    }

    private void createCell(Row row, int column, Integer value, CellStyle style) {
        Cell cell = row.createCell(column);
        if (value != null) {
            cell.setCellValue(value);
        }
        cell.setCellStyle(style);
    }

    private void createCell(Row row, int column, Double value, CellStyle style) {
        Cell cell = row.createCell(column);
        if (value != null) {
            cell.setCellValue(value);
        }
        cell.setCellStyle(style);
    }

    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        return style;
    }

    private CellStyle createDataStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        return style;
    }

    public byte[] exportSingleSupplierToExcel(Supplier supplier) throws IOException {
        if (supplier == null) {
            throw new IllegalArgumentException("Supplier cannot be null");
        }

        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            // Create styles once
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dataStyle = createDataStyle(workbook);

            // Create sheet for the single supplier
            Sheet sheet = workbook.createSheet(sanitizeSheetName(supplier.getName()));

            // Create header row
            createHeaders(sheet.createRow(0), headerStyle);

            // Add client data
            int rowNum = 1;
            for (Client client : supplier.getClients()) {
                Row row = sheet.createRow(rowNum++);
                populateClientData(row, client, dataStyle);
            }

            // Auto-size columns
            for (int i = 0; i < 30; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(outputStream);
            byte[] excelBytes = outputStream.toByteArray();

            // Save export history
            String fileName = sanitizeSheetName(supplier.getName()) + "_export_" + LocalDate.now() + ".xlsx";
            saveExportHistory(fileName, excelBytes);

            return excelBytes;
        }
    }
    private void saveExportHistory(String fileName, byte[] fileContent) {
        ExportHistory history = new ExportHistory();
        history.setFileName(fileName);
        history.setFileContent(fileContent);
        exportHistoryRepository.save(history);  // Call save on the instance, not the class
    }
    // NEW METHOD: Export suppliers and save to DB but return History object (no download)
    public ExportHistory exportSuppliersToExcelDbOnly(List<Supplier> suppliers) throws IOException {
        if (suppliers == null || suppliers.isEmpty()) {
            throw new IllegalArgumentException("Supplier list cannot be null or empty");
        }

        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            // Create styles once
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dataStyle = createDataStyle(workbook);

            for (Supplier supplier : suppliers) {
                // Validate supplier has clients
                if (supplier.getClients() == null || supplier.getClients().isEmpty()) {
                    continue; // Skip suppliers without clients or create empty sheet
                }

                Sheet sheet = workbook.createSheet(sanitizeSheetName(supplier.getName()));

                // Create header row
                createHeaders(sheet.createRow(0), headerStyle);

                // Add client data
                int rowNum = 1;
                for (Client client : supplier.getClients()) {
                    Row row = sheet.createRow(rowNum++);
                    populateClientData(row, client, dataStyle);
                }

                // Auto-size columns
                for (int i = 0; i < 30; i++) {
                    sheet.autoSizeColumn(i);
                }
            }

            workbook.write(outputStream);
            byte[] excelBytes = outputStream.toByteArray();

            // Save export history to database
            String fileName = "Base de données exportée le " + LocalDate.now() + ".xlsx";
            ExportHistory history = new ExportHistory(fileName, excelBytes);

            return exportHistoryRepository.save(history); // Save to DB and return the record
        }
    }

    // NEW METHOD: Export single supplier and save to DB but return History object (no download)
    public ExportHistory exportSingleSupplierToExcelDbOnly(Supplier supplier) throws IOException {
        if (supplier == null) {
            throw new IllegalArgumentException("Supplier cannot be null");
        }

        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            // Create styles once
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dataStyle = createDataStyle(workbook);

            // Create sheet for the single supplier
            Sheet sheet = workbook.createSheet(sanitizeSheetName(supplier.getName()));

            // Create header row
            createHeaders(sheet.createRow(0), headerStyle);

            // Add client data
            int rowNum = 1;
            for (Client client : supplier.getClients()) {
                Row row = sheet.createRow(rowNum++);
                populateClientData(row, client, dataStyle);
            }

            // Auto-size columns
            for (int i = 0; i < 30; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(outputStream);
            byte[] excelBytes = outputStream.toByteArray();

            // Save export history to database
            String fileName = sanitizeSheetName(supplier.getName()) + "_export_" + LocalDate.now() + ".xlsx";
            ExportHistory history = new ExportHistory(fileName, excelBytes);

            return exportHistoryRepository.save(history); // Save to DB and return the record
        }
    }

}