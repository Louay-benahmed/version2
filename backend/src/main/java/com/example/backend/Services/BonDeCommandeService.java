package com.example.backend.Services;

import com.example.backend.Entity.BonDeCommande;
import com.example.backend.Repositories.BonDeCommandeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

@Service
public class BonDeCommandeService {
    @Autowired
    private BonDeCommandeRepository bonDeCommandeRepository;

    public List<BonDeCommande> getAllBonDeCommandes() {
        return bonDeCommandeRepository.findAllWithClient();
    }

    public List<BonDeCommande> getPaidBonDeCommandes() {
        return bonDeCommandeRepository.findPaidWithClient();
    }

    public List<BonDeCommande> getUnpaidBonDeCommandes() {
        return bonDeCommandeRepository.findUnpaidWithClient();
    }
    // Also update the payment status method to handle payment date
    public void updatePaymentStatus(Integer id, boolean paymentStatus) {
        BonDeCommande commande = bonDeCommandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bon de commande not found"));
        commande.setPayment(paymentStatus);
        if (paymentStatus) {
            // When marking as paid:
            commande.setPaymentDate(new Date());
            commande.setDeadline(null);// Reset deadline to null

        } else {
            commande.setPaymentDate(null);
        }
        bonDeCommandeRepository.save(commande);
    }

    public void deleteBonDeCommande(Integer id) {
        BonDeCommande commande = bonDeCommandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bon de commande not found"));
        bonDeCommandeRepository.delete(commande);
    }

    public List<BonDeCommande> getPaidBonDeCommandesByClientName(String clientName) {
        return bonDeCommandeRepository.findPaidByClientName(clientName);
    }

    public List<BonDeCommande> getUnpaidBonDeCommandesByClientName(String clientName) {
        return bonDeCommandeRepository.findUnpaidByClientName(clientName);
    }

    public void setDeadline(Integer id, Date deadline) {
        BonDeCommande commande = bonDeCommandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bon de commande not found"));
        commande.setDeadline(deadline);
        bonDeCommandeRepository.save(commande);
    }

    public void setPaymentDateToToday(Integer id) {
        BonDeCommande commande = bonDeCommandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bon de commande not found"));
        commande.setPaymentDate(new Date());
        bonDeCommandeRepository.save(commande);
    }
}