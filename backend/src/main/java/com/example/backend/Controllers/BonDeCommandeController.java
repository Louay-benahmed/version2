package com.example.backend.Controllers;

import com.example.backend.Entity.BonDeCommande;
import com.example.backend.Services.BonDeCommandeService;
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
@RequestMapping("/api/bon-de-commandes")
public class BonDeCommandeController {

    @Autowired
    private BonDeCommandeService bonDeCommandeService;
    @Autowired
    private JavaMailSender mailSender;

    @GetMapping
    public ResponseEntity<List<BonDeCommande>> getAllBonDeCommandes() {
        return ResponseEntity.ok(bonDeCommandeService.getAllBonDeCommandes());
    }

    @GetMapping("/paid")
    public ResponseEntity<List<BonDeCommande>> getPaidBonDeCommandes() {
        return ResponseEntity.ok(bonDeCommandeService.getPaidBonDeCommandes());
    }

    @GetMapping("/unpaid")
    public ResponseEntity<List<BonDeCommande>> getUnpaidBonDeCommandes() {
        return ResponseEntity.ok(bonDeCommandeService.getUnpaidBonDeCommandes());
    }

    @PostMapping("/send-email")
    public ResponseEntity<String> sendBonDeCommandeByEmail(
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
            helper.setSubject("Your Bon de Commande Document");
            helper.setText("Please find attached your bon de commande document.");
            helper.addAttachment("bon_de_commande.pdf", new ByteArrayResource(pdfBytes));

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
            bonDeCommandeService.updatePaymentStatus(id, paymentStatus);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to update payment status: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBonDeCommande(@PathVariable Integer id) {
        try {
            bonDeCommandeService.deleteBonDeCommande(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to delete bon de commande: " + e.getMessage());
        }
    }

    @GetMapping("/client/{clientName}/paid")
    public ResponseEntity<List<BonDeCommande>> getPaidBonDeCommandesByClient(@PathVariable String clientName) {
        List<BonDeCommande> commandes = bonDeCommandeService.getPaidBonDeCommandesByClientName(clientName);
        return ResponseEntity.ok(commandes);
    }

    @GetMapping("/client/{clientName}/unpaid")
    public ResponseEntity<List<BonDeCommande>> getUnpaidBonDeCommandesByClient(@PathVariable String clientName) {
        List<BonDeCommande> commandes = bonDeCommandeService.getUnpaidBonDeCommandesByClientName(clientName);
        return ResponseEntity.ok(commandes);
    }
}