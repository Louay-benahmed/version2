package com.example.backend.Services;

import com.example.backend.Entity.Facture;
import com.example.backend.Repositories.FactureRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FactureService {
    @Autowired
    private FactureRepository factureRepository;

    public List<Facture> getAllFactures() {
        return factureRepository.findAllWithSupplier();
    }

    public List<Facture> getPaidFactures() {
        return factureRepository.findPaidWithSupplier();
    }

    public List<Facture> getUnpaidFactures() {
        return factureRepository.findUnpaidWithSupplier();
    }
    public void updatePaymentStatus(Integer id, boolean paymentStatus) {
        Facture facture = factureRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Facture not found"));
        facture.setPayment(paymentStatus);
        factureRepository.save(facture);
    }

    public void deleteFacture(Integer id) {
        Facture facture = factureRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Facture not found"));
        factureRepository.delete(facture);
    }

    public List<Facture> getPaidFacturesBySupplierId(Integer supplierId) {
        return factureRepository.findPaidBySupplierId(supplierId);
    }

    public List<Facture> getUnpaidFacturesBySupplierId(Integer supplierId) {
        return factureRepository.findUnpaidBySupplierId(supplierId);
    }
}
