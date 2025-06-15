package com.example.backend.Controllers;

import com.example.backend.Entity.Facture;
import com.example.backend.Services.FactureService;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.web.bind.annotation.*;

import java.util.Base64;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/factures")
public class FactureController {

    @Autowired
    private FactureService factureService;

    @Autowired
    private JavaMailSender mailSender;

    @GetMapping
    public ResponseEntity<List<Facture>> getAllFactures() {
        return ResponseEntity.ok(factureService.getAllFactures());
    }

    @GetMapping("/paid")
    public ResponseEntity<List<Facture>> getPaidFactures() {
        return ResponseEntity.ok(factureService.getPaidFactures());
    }

    @GetMapping("/unpaid")
    public ResponseEntity<List<Facture>> getUnpaidFactures() {
        return ResponseEntity.ok(factureService.getUnpaidFactures());
    }


    @PostMapping("/send-email")
    public ResponseEntity<String> sendFactureByEmail(
            @RequestBody Map<String, String> request) {

        try {
            String documentContent = request.get("documentContent");
            String email = request.get("recipientEmail");

            if (email == null || email.isBlank()) {
                return ResponseEntity.badRequest().body("Recipient email is required");
            }

            byte[] pdfBytes = Base64.getDecoder().decode(documentContent);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            helper.setTo(email);
            helper.setSubject("Your Facture Document");
            helper.setText("Please find attached your facture document.");
            helper.addAttachment("facture.pdf", new ByteArrayResource(pdfBytes));

            mailSender.send(message);

            return ResponseEntity.ok("Email sent successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to send email: " + e.getMessage());
        }
    }
    @PutMapping("/payment-status/{id}")
    public ResponseEntity<?> updatePaymentStatus(
            @PathVariable Integer id,
            @RequestBody Map<String, Boolean> request) {
        try {
            boolean paymentStatus = request.get("payment");
            factureService.updatePaymentStatus(id, paymentStatus);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to update payment status: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteFacture(@PathVariable Integer id) {
        try {
            factureService.deleteFacture(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to delete facture: " + e.getMessage());
        }
    }

    @GetMapping("/supplier/{supplierId}/paid")
    public ResponseEntity<List<Facture>> getPaidFacturesBySupplier(@PathVariable Integer supplierId) {
        List<Facture> factures = factureService.getPaidFacturesBySupplierId(supplierId);
        return ResponseEntity.ok(factures);
    }

    @GetMapping("/supplier/{supplierId}/unpaid")
    public ResponseEntity<List<Facture>> getUnpaidFacturesBySupplier(@PathVariable Integer supplierId) {
        List<Facture> factures = factureService.getUnpaidFacturesBySupplierId(supplierId);
        return ResponseEntity.ok(factures);
    }

}