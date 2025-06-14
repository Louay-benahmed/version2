package com.example.backend.Services;

import com.example.backend.Entity.*;
import com.example.backend.Repositories.BonDeCommandeRepository;
import com.example.backend.Repositories.ClientRepository;
import com.example.backend.Repositories.FactureRepository;
import com.itextpdf.text.*;
import com.itextpdf.text.Font;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.itextpdf.text.pdf.*;
import com.itextpdf.text.pdf.draw.LineSeparator;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestParam;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.Year;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;


@Service
public class FileGenerationService {
    @Autowired
    private FactureRepository factureRepository;

    @Autowired
    private BonDeCommandeRepository bonDeCommandeRepository;
    @Autowired
    private ClientRepository clientRepository;

    private String currentDate = LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
    private static final Logger log = LoggerFactory.getLogger(FileGenerationService.class);

    public byte[] generatePdf(Supplier supplier, String quarterChoice) throws DocumentException, IOException {
        Integer invoiceNumber = generateNextInvoiceNumber();
        String formattedInvoiceNumber = String.format("%08d", invoiceNumber);

        byte[] pdfBytes = generateAndSaveFacture(supplier, formattedInvoiceNumber, quarterChoice);

        Facture facture = new Facture();
        facture.setDocument(pdfBytes);
        facture.setNumero(invoiceNumber);
        facture.setSupplier(supplier);
        facture.setDateCreation(new Date());
        facture.setPayment(false);

        factureRepository.save(facture);
        return pdfBytes;
    }

    public byte[] generatePdf(Supplier supplier) throws DocumentException, IOException {
        return generatePdf(supplier, "auto");
    }

    private Integer generateNextInvoiceNumber() {
        int currentYear = Year.now().getValue();
        Integer maxNumero = factureRepository.findMaxNumeroForCurrentYear();
        if (maxNumero == null) {
            return currentYear * 10000 + 1;
        }
        return maxNumero + 1;
    }

    public int getCurrentQuarter() {
        int month = LocalDate.now().getMonthValue();
        return (month - 1) / 3 + 1;
    }



    public byte[] generateAndSaveFacture(Supplier supplier, String invoiceNumber, String quarterChoice) throws DocumentException, IOException {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 36, 36, 60, 36);
        PdfWriter writer = PdfWriter.getInstance(document, outputStream);

        // Font definitions
        Font titleFont = new Font(Font.FontFamily.HELVETICA, 18, Font.BOLD, BaseColor.DARK_GRAY);
        Font headerFont = new Font(Font.FontFamily.HELVETICA, 12, Font.BOLD, BaseColor.DARK_GRAY);
        Font normalFont = new Font(Font.FontFamily.HELVETICA, 10, Font.NORMAL, BaseColor.DARK_GRAY);
        Font boldFont = new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD, BaseColor.DARK_GRAY);
        Font accentFont = new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD, new BaseColor(0, 102, 204));
        Font footerFont = new Font(Font.FontFamily.HELVETICA, 8, Font.NORMAL, BaseColor.GRAY);

        // Footer setup
        writer.setPageEvent(new PdfPageEventHelper() {
            @Override
            public void onEndPage(PdfWriter writer, Document document) {
                PdfContentByte canvas = writer.getDirectContent();
                float footerY = 40;

                canvas.setLineWidth(1f);
                canvas.setColorStroke(BaseColor.LIGHT_GRAY);
                canvas.moveTo(document.leftMargin(), footerY);
                canvas.lineTo(document.getPageSize().getWidth() - document.rightMargin(), footerY);
                canvas.stroke();

                ColumnText.showTextAligned(
                        canvas,
                        Element.ALIGN_CENTER,
                        new Phrase("Sentinel Data - RC: B01126482017 - MF: 15189638/A/M 000 - RIB: 0B 032012 0410016325 35", footerFont),
                        document.getPageSize().getWidth() / 2,
                        footerY - 12,
                        0
                );

                ColumnText.showTextAligned(
                        canvas,
                        Element.ALIGN_CENTER,
                        new Phrase("Merci pour votre confiance",
                                FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 9, BaseColor.GRAY)),
                        document.getPageSize().getWidth() / 2,
                        footerY - 24,
                        0
                );
            }
        });

        document.open();

        // Get quarter display based on choice
        String currentQuarter = getQuarterDisplay(quarterChoice);
        int repetitionCount = quarterChoice.equals("auto") ? 1 : quarterChoice.trim().split("\\s+").length;
        System.out.println("Quarter choice: " + quarterChoice);
        System.out.println("Repetition count: " + repetitionCount);

        // Header table
        PdfPTable headerTable = new PdfPTable(2);
        headerTable.setWidthPercentage(100);

        PdfPCell companyCell = new PdfPCell();
        companyCell.setBorder(Rectangle.NO_BORDER);
        companyCell.addElement(new Paragraph("SENTINEL DATA", titleFont));
        companyCell.addElement(new Paragraph("www.sentineld.com | contact@sentineld.com", normalFont));
        companyCell.addElement(new Paragraph("Rue Du Lac Victoria, Résidence 2001", normalFont));
        companyCell.addElement(new Paragraph("Bloc C, RDC, Appartement C04", normalFont));
        companyCell.addElement(new Paragraph("1053, Lac 1, Tunis", normalFont));
        headerTable.addCell(companyCell);

        PdfPCell invoiceCell = new PdfPCell();
        invoiceCell.setBorder(Rectangle.NO_BORDER);
        invoiceCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        invoiceCell.addElement(new Paragraph("FACTURE", new Font(Font.FontFamily.HELVETICA, 24, Font.BOLD, new BaseColor(0, 102, 204))));
        invoiceCell.addElement(new Paragraph("N°: " + invoiceNumber, accentFont));
        invoiceCell.addElement(new Paragraph("Date: " + currentDate, normalFont));
        invoiceCell.addElement(new Paragraph(currentQuarter, normalFont));
        headerTable.addCell(invoiceCell);

        document.add(headerTable);

        // Add separator line
        Paragraph separator = new Paragraph();
        separator.add(new Chunk(new LineSeparator(1f, 100f, BaseColor.LIGHT_GRAY, Element.ALIGN_CENTER, -1)));
        document.add(separator);

        // Client information section
        PdfPTable clientTable = new PdfPTable(2);
        clientTable.setWidthPercentage(100);
        clientTable.setSpacingBefore(15f);

        String supplierName = supplier.getName();
        String secondWord = supplierName.split(" ")[1]; // Split by space and take index 1 (second word)
        PdfPCell clientHeader = new PdfPCell(new Phrase(secondWord, accentFont));

        clientHeader.setColspan(2);
        clientHeader.setBorder(Rectangle.NO_BORDER);
        clientHeader.setPaddingBottom(5f);
        clientTable.addCell(clientHeader);

        PdfPCell clientDetails = new PdfPCell();
        clientDetails.setBorder(Rectangle.NO_BORDER);
        clientDetails.addElement(new Paragraph(
                "Date de contrat: " + (supplier.getDateDeContrat() != null ?
                        supplier.getDateDeContrat().toString() : "XX/XX/XXXX"),
                normalFont
        ));
        clientDetails.addElement(new Paragraph("Adresse: " + supplier.getAdress(), normalFont));
        clientTable.addCell(clientDetails);

        PdfPCell fiscalDetails = new PdfPCell();
        fiscalDetails.setBorder(Rectangle.NO_BORDER);
        fiscalDetails.setHorizontalAlignment(Element.ALIGN_RIGHT);
        fiscalDetails.addElement(new Paragraph("MF: " + (supplier.getMatricule_fiscale() != null ?
                supplier.getMatricule_fiscale().toString() : ""), normalFont));
        fiscalDetails.addElement(new Paragraph("RIB: " + (supplier.getRIB() != null ?
                supplier.getRIB().toString() : ""), normalFont));
        clientTable.addCell(fiscalDetails);

        document.add(clientTable);

        // table
        if (!supplier.getSolutions().isEmpty()) {
            PdfPTable itemsTable = new PdfPTable(new float[]{0.7f, 3f, 1f, 1f, 1f, 0.8f, 0.8f, 1.2f});
            itemsTable.setWidthPercentage(100);
            itemsTable.setSpacingBefore(20f);
            itemsTable.setHeaderRows(1);

            String[] headers = {"Ligne", "Description", "Quantité", "Unité", "Prix HT", "Devise", "TVA", "Total HT"};
            for (String header : headers) {
                PdfPCell headerCell = new PdfPCell(new Phrase(header, accentFont));
                headerCell.setBackgroundColor(new BaseColor(240, 240, 240));
                headerCell.setPadding(5f);
                itemsTable.addCell(headerCell);
            }

            BigDecimal totalHT = BigDecimal.ZERO;
            BigDecimal totalTVA = BigDecimal.ZERO;
            int lineNumber = 1;

            for (Solution solution : supplier.getSolutions()) {
                BigDecimal prixHT = solution.getPrix() != null ?
                        BigDecimal.valueOf(solution.getPrix()) : BigDecimal.ZERO;
                BigDecimal taxRate = solution.getTax() != null ?
                        new BigDecimal(solution.getTax().toString()).divide(new BigDecimal(100), RoundingMode.HALF_UP) :
                        new BigDecimal("0.19");
                BigDecimal quantity = new BigDecimal(3);
                BigDecimal lineTotal = prixHT.multiply(quantity).multiply(new BigDecimal(repetitionCount));

                // Repeat each line based on quarter count
                for (int i = 0; i < repetitionCount; i++) {
                    itemsTable.addCell(createStyledCell(String.valueOf(lineNumber++), normalFont));
                    itemsTable.addCell(createStyledCell(solution.getDescription() != null ? solution.getDescription() : "", normalFont));
                    itemsTable.addCell(createStyledCell("3", normalFont));
                    itemsTable.addCell(createStyledCell("Mois", normalFont));
                    itemsTable.addCell(createStyledCell(String.format("%,.3f", prixHT), normalFont));
                    itemsTable.addCell(createStyledCell("TND", normalFont));
                    itemsTable.addCell(createStyledCell(solution.getTax() != null ? solution.getTax().toString() + "%" : "19%", normalFont));
                    itemsTable.addCell(createStyledCell(String.format("%,.3f", prixHT.multiply(quantity)), boldFont));
                }

                totalHT = totalHT.add(lineTotal);
                totalTVA = totalTVA.add(lineTotal.multiply(taxRate));
            }

            document.add(itemsTable);

            // Totals section
            PdfPTable totalsTable = new PdfPTable(2);
            totalsTable.setWidthPercentage(40);
            totalsTable.setHorizontalAlignment(Element.ALIGN_RIGHT);
            totalsTable.setSpacingBefore(15f);

            BigDecimal timbreFiscal = new BigDecimal("1.000");
            BigDecimal totalTTC = totalHT.add(totalTVA).add(timbreFiscal);

            addTotalRow(totalsTable, "Total HT:", String.format("%,.3f DT", totalHT), boldFont);
            addTotalRow(totalsTable, "Total TVA:", String.format("%,.3f DT", totalTVA), boldFont);
            addTotalRow(totalsTable, "Timbre fiscal:", String.format("%,.3f DT", timbreFiscal), boldFont);
            addTotalRow(totalsTable, "Total TTC:", String.format("%,.3f DT", totalTTC), boldFont);

            document.add(totalsTable);

            // Amount in words
            int dinars = totalTTC.intValue();
            int millimes = totalTTC.remainder(BigDecimal.ONE).multiply(new BigDecimal(1000)).intValue();

            Paragraph amountInWords = new Paragraph();
            amountInWords.add(new Chunk("Arrêté la présente facture à la somme de : ", boldFont));
            amountInWords.add(new Chunk(dinars + " Dinars " + millimes + " Millimes.", normalFont));
            amountInWords.setSpacingBefore(10f);
            document.add(amountInWords);

        } else {
            document.add(new Paragraph("Aucune solution associée à ce fournisseur.", normalFont));
        }

        document.close();
        return outputStream.toByteArray();
    }

    public byte[] generateAndSaveFacture(Supplier supplier, String invoiceNumber) throws DocumentException, IOException {
        return generateAndSaveFacture(supplier, invoiceNumber, "auto");
    }

    private String getQuarterDisplay(String quarterChoice) {
        if ("auto".equals(quarterChoice)) {
            return "Trimestre " + getCurrentQuarter() + " " + Year.now().getValue();
        } else {
            String[] quarters = quarterChoice.split("\\+");
            if (quarters.length == 1) {
                return "Trimestre " + quarters[0] + " " + Year.now().getValue();
            } else {
                return "Trimestres " + String.join("+", quarters) + " " + Year.now().getValue();
            }
        }
    }

    private PdfPCell createStyledCell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setPadding(5f);
        return cell;
    }

    private void addTotalRow(PdfPTable table, String label, String value, Font font) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label, font));
        labelCell.setBorder(Rectangle.NO_BORDER);
        labelCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        table.addCell(labelCell);

        PdfPCell valueCell = new PdfPCell(new Phrase(value, font));
        valueCell.setBorder(Rectangle.NO_BORDER);
        valueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        table.addCell(valueCell);
    }


    //////////////////////////////////////////////////////////////////////////////////


    public byte[] generateClientPdf(Client client, String moinsX, String moinsY, double rsPercentage, double tvaPercentage) throws DocumentException, IOException {
        // Validate inputs
        if (client.getUniqueIdentifier() == null) {
            throw new IllegalArgumentException("Client missing uniqueIdentifier");
        }

        // Validate month names
        List<String> validMonths = List.of("jan", "feb", "mar", "apr", "may", "jun",
                "jul", "aug", "sep", "oct", "nov", "dec");

        String moisXLower = moinsX.toLowerCase();
        String moisYLower = moinsY.toLowerCase();

        if (!validMonths.contains(moisXLower) || !validMonths.contains(moisYLower)) {
            throw new IllegalArgumentException(
                    "Invalid month names provided. Valid values are: " + validMonths);
        }

        log.info("Generating PDF for client {} with RS: {}%, TVA: {}%, period: {}-{}",
                client.getId(), rsPercentage, tvaPercentage, moinsX, moinsY);
        // Generate document number
        LocalDate now = LocalDate.now();
        int year = now.getYear();
        int currentMonth = now.getMonthValue();

        String lastNumero = bonDeCommandeRepository.findLastNumeroForMonth(year, currentMonth);
        int nextSequence = lastNumero != null ?
                Integer.parseInt(lastNumero.split("-")[1]) + 1 : 1;

        String fullNumero = String.format("%04d%02d-%05d", year, currentMonth, nextSequence);

        // PDF setup
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 36, 36, 60, 36);
        PdfWriter writer = PdfWriter.getInstance(document, outputStream);

        // Font definitions
        Font titleFont = new Font(Font.FontFamily.HELVETICA, 18, Font.BOLD, BaseColor.DARK_GRAY);
        Font normalFont = new Font(Font.FontFamily.HELVETICA, 10, Font.NORMAL, BaseColor.DARK_GRAY);
        Font boldFont = new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD, BaseColor.DARK_GRAY);
        Font accentFont = new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD, new BaseColor(0, 102, 204));
        Font footerFont = new Font(Font.FontFamily.HELVETICA, 8, Font.NORMAL, BaseColor.GRAY);

        // Footer setup
        writer.setPageEvent(new PdfPageEventHelper() {
            public void onEndPage(PdfWriter writer, Document document) {
                PdfContentByte canvas = writer.getDirectContent();
                float footerY = 40;

                canvas.setLineWidth(1f);
                canvas.setColorStroke(BaseColor.LIGHT_GRAY);
                canvas.moveTo(document.leftMargin(), footerY);
                canvas.lineTo(document.getPageSize().getWidth() - document.rightMargin(), footerY);
                canvas.stroke();

                ColumnText.showTextAligned(canvas, Element.ALIGN_CENTER,
                        new Phrase("Sentinel Data - RC: B01126482017 - MF: 15189638/A/M 000 - RIB: 0B 032012 0410016325 35", footerFont),
                        document.getPageSize().getWidth() / 2, footerY - 12, 0);

                ColumnText.showTextAligned(canvas, Element.ALIGN_CENTER,
                        new Phrase("Merci pour votre confiance",
                                FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 9, BaseColor.GRAY)),
                        document.getPageSize().getWidth() / 2, footerY - 24, 0);
            }
        });

        document.open();

        // Header table
        PdfPTable headerTable = new PdfPTable(2);
        headerTable.setWidthPercentage(100);

        PdfPCell companyCell = new PdfPCell();
        companyCell.setBorder(Rectangle.NO_BORDER);
        companyCell.addElement(new Paragraph("SENTINEL DATA", titleFont));
        companyCell.addElement(new Paragraph("www.sentineld.com | contact@sentineld.com", normalFont));
        companyCell.addElement(new Paragraph("Rue Du Lac Victoria, Résidence 2001", normalFont));
        companyCell.addElement(new Paragraph("Bloc C, RDC, Appartement C04", normalFont));
        companyCell.addElement(new Paragraph("1053, Lac 1, Tunis", normalFont));
        headerTable.addCell(companyCell);

        PdfPCell documentCell = new PdfPCell();
        documentCell.setBorder(Rectangle.NO_BORDER);
        documentCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        documentCell.addElement(new Paragraph("Bon de commande",
                new Font(Font.FontFamily.HELVETICA, 24, Font.BOLD, new BaseColor(0, 102, 204))));
        documentCell.addElement(new Paragraph("N°: " + String.format("%s-%s-%s",
                fullNumero.substring(0, 6), client.getUniqueIdentifier(), fullNumero.substring(7)), accentFont));
        documentCell.addElement(new Paragraph("Date: " + currentDate, normalFont));
        headerTable.addCell(documentCell);

        document.add(headerTable);
        document.add(new Chunk(new LineSeparator(1f, 100f, BaseColor.LIGHT_GRAY, Element.ALIGN_CENTER, -1)));

        // Client information
        PdfPTable clientTable = new PdfPTable(2);
        clientTable.setWidthPercentage(100);
        clientTable.setSpacingBefore(15f);

        PdfPCell clientHeader = new PdfPCell(new Phrase("Grossiste Information :", accentFont));
        clientHeader.setColspan(2);
        clientHeader.setBorder(Rectangle.NO_BORDER);
        clientHeader.setPaddingBottom(5f);
        clientTable.addCell(clientHeader);

        PdfPCell clientDetails = new PdfPCell();
        clientDetails.setBorder(Rectangle.NO_BORDER);
        clientDetails.addElement(new Paragraph("Nom: " + client.getName(), normalFont));
        clientDetails.addElement(new Paragraph("Adresse: " +
                (client.getAdress() != null ? client.getAdress() : "Non spécifiée"), normalFont));
        clientTable.addCell(clientDetails);

        PdfPCell fiscalDetails = new PdfPCell();
        fiscalDetails.setBorder(Rectangle.NO_BORDER);
        fiscalDetails.setHorizontalAlignment(Element.ALIGN_RIGHT);
        fiscalDetails.addElement(new Paragraph("MF: " +
                (client.getMatricule_fiscale() != null ? client.getMatricule_fiscale() : ""), normalFont));
        fiscalDetails.addElement(new Paragraph("Date: " + currentDate, normalFont));
        clientTable.addCell(fiscalDetails);

        document.add(clientTable);

        // Month order mapping
        Map<String, Integer> monthOrder = new HashMap<>();
        monthOrder.put("jan", 1);
        monthOrder.put("feb", 2);
        monthOrder.put("mar", 3);
        monthOrder.put("apr", 4);
        monthOrder.put("may", 5);
        monthOrder.put("jun", 6);
        monthOrder.put("jul", 7);
        monthOrder.put("aug", 8);
        monthOrder.put("sep", 9);
        monthOrder.put("oct", 10);
        monthOrder.put("nov", 11);
        monthOrder.put("dec", 12);

        Integer startMonth = monthOrder.get(moisXLower);
        Integer endMonth = monthOrder.get(moisYLower);

        // Create items table
        PdfPTable itemsTable = new PdfPTable(new float[]{3f, 1.1f, 0.6f, 0.5f, 0.4f, 0.5f, 1.1f});
        itemsTable.setWidthPercentage(100);
        itemsTable.setSpacingBefore(20f);
        itemsTable.setHeaderRows(1);

        // Table headers
        Stream.of("Description", "Prix unitaire", "Devise", "TVA", "RS", "Mois", "Total HT")
                .forEach(header -> {
                    PdfPCell cell = new PdfPCell(new Phrase(header, accentFont));
                    cell.setBackgroundColor(new BaseColor(240, 240, 240));
                    cell.setPadding(5f);
                    itemsTable.addCell(cell);
                });

        // Get all clients with the same name
        List<Client> clientsWithSameName = clientRepository.findByName(client.getName());
        BigDecimal grandTotalHT = BigDecimal.ZERO;

        for (Client matchingClient : clientsWithSameName) {
            ClientExcelData excelData = matchingClient.getExcelData();
            if (excelData == null) {
                continue;
            }

            // Get status for each month for this client
            Map<String, String> monthStatus = new HashMap<>();
            monthStatus.put("jan", excelData.getJanStatus());
            monthStatus.put("feb", excelData.getFebStatus());
            monthStatus.put("mar", excelData.getMarStatus());
            monthStatus.put("apr", excelData.getAprStatus());
            monthStatus.put("may", excelData.getMayStatus());
            monthStatus.put("jun", excelData.getJunStatus());
            monthStatus.put("jul", excelData.getJulStatus());
            monthStatus.put("aug", excelData.getAugStatus());
            monthStatus.put("sep", excelData.getSepStatus());
            monthStatus.put("oct", excelData.getOctStatus());
            monthStatus.put("nov", excelData.getNovStatus());
            monthStatus.put("dec", excelData.getDecStatus());

            // Count "Yes" months for this client
            long moisCount = monthOrder.entrySet().stream()
                    .filter(entry -> {
                        int monthNum = entry.getValue();
                        return monthNum >= startMonth && monthNum <= endMonth &&
                                "Yes".equalsIgnoreCase(monthStatus.get(entry.getKey()));
                    })
                    .count();

            if (moisCount == 0) continue;

            Double monthlyPayment = excelData.getMonthlyPayment();
            if (monthlyPayment == null) {
                continue;
            }

            BigDecimal prixUnitaire = BigDecimal.valueOf(monthlyPayment)
                    .setScale(3, RoundingMode.HALF_UP);
            BigDecimal totalHT = prixUnitaire.multiply(BigDecimal.valueOf(moisCount));
            grandTotalHT = grandTotalHT.add(totalHT);

            String description = String.format("Données de %s: de %s à %s %d",
                    matchingClient.getSupplier() != null ?
                            matchingClient.getSupplier().getName() : "Unknown Supplier",
                    moinsX, moinsY,
                    now.getYear());

            itemsTable.addCell(createStyledCell(description, normalFont));
            itemsTable.addCell(createStyledCell(String.format("%,.3f", prixUnitaire), normalFont));
            itemsTable.addCell(createStyledCell("TND", normalFont));
            itemsTable.addCell(createStyledCell(String.format("%.0f%%", tvaPercentage), normalFont));
            itemsTable.addCell(createStyledCell(String.format("%.0f%%", rsPercentage), normalFont));
            itemsTable.addCell(createStyledCell(String.valueOf(moisCount), normalFont));
            itemsTable.addCell(createStyledCell(String.format("%,.3f", totalHT), boldFont));
        }

        document.add(itemsTable);
        // Calculate grand totals
        BigDecimal totalTVA = grandTotalHT.multiply(
                BigDecimal.valueOf(tvaPercentage).divide(BigDecimal.valueOf(100), 3, RoundingMode.HALF_UP));

        BigDecimal totalTTC = grandTotalHT.add(totalTVA);
        BigDecimal totalRS = totalTTC.multiply(
                BigDecimal.valueOf(rsPercentage).divide(BigDecimal.valueOf(100), 3, RoundingMode.HALF_UP));

        BigDecimal netAPayer = totalTTC.subtract(totalRS);

        // Add totals section
        PdfPTable totalsTable = new PdfPTable(2);
        totalsTable.setWidthPercentage(40);
        totalsTable.setHorizontalAlignment(Element.ALIGN_RIGHT);
        totalsTable.setSpacingBefore(15f);

        addTotalRow(totalsTable, "Total HT:", String.format("%,.3f DT", grandTotalHT), boldFont);
        addTotalRow(totalsTable, "Total TVA:", String.format("%,.3f DT", totalTVA), boldFont);
        addTotalRow(totalsTable, "Total (TTC):", String.format("%,.3f DT", totalTTC), boldFont);
        addTotalRow(totalsTable, "RS:", String.format("%,.3f DT", totalRS), boldFont);
        addTotalRow(totalsTable, "Net à payer:", String.format("%,.3f DT", netAPayer),
                new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD, new BaseColor(0, 102, 204)));

        document.add(totalsTable);
        document.close();

        // Save to database
        BonDeCommande bonDeCommande = new BonDeCommande();
        bonDeCommande.setDocument(outputStream.toByteArray());
        bonDeCommande.setNumero(fullNumero);
        bonDeCommande.setDateCreation(new Date());
        bonDeCommande.setClient(client);
        bonDeCommande.setPayment(false);


        if (client.getBonDeCommandes() == null) {
            client.setBonDeCommandes(new ArrayList<>());
        }
        client.getBonDeCommandes().add(bonDeCommande);

        bonDeCommandeRepository.save(bonDeCommande);
        clientRepository.save(client);

        return outputStream.toByteArray();
    }

       private void addClientDetailRow(PdfPTable table, String label, String value, Font font) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label, font));
        labelCell.setBorder(Rectangle.NO_BORDER);
        labelCell.setPadding(5f);
        table.addCell(labelCell);

        PdfPCell valueCell = new PdfPCell(new Phrase(value, font));
        valueCell.setBorder(Rectangle.NO_BORDER);
        valueCell.setPadding(5f);
        table.addCell(valueCell);
    }
}