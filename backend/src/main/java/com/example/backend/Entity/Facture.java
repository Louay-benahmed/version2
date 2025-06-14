package com.example.backend.Entity;

import com.fasterxml.jackson.annotation.*;
import jakarta.persistence.*;
import java.time.Year;
import java.util.Date;

@Entity
public class Facture {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer facture_id;

    @Lob
    @Column(nullable = false, length = 16777215)
    private byte[] document;


    @Column(nullable = false, unique = true)
    private Integer numero;

    @Column(nullable = false)
    private Date dateCreation;

    @Column(nullable = false)
    private boolean payment;
    // 0 = false (non payé)
    // 1 = true (payé)


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "factures"})
    private Supplier supplier;

    public Facture() {
        this.dateCreation = new Date();
    }

    public Facture(byte[] document, Supplier supplier) {
        this();
        this.document = document;
        this.supplier = supplier;
    }

    public Integer getFacture_id() {
        return facture_id;
    }
    public void setFacture_id(Integer facture_id) {
        this.facture_id = facture_id;
    }


    public byte[] getDocument() {
        return document;
    }

    public void setDocument(byte[] document) {
        this.document = document;
    }

    public Integer getNumero() {
        return numero;
    }

    public void setNumero(Integer numero) {
        this.numero = numero;
    }

    public Date getDateCreation() {
        return dateCreation;
    }

    public void setDateCreation(Date dateCreation) {
        this.dateCreation = dateCreation;
    }

    public Supplier getSupplier() {
        return supplier;
    }

    public void setSupplier(Supplier supplier) {
        this.supplier = supplier;
    }

    // Payment status methods
    public boolean isPayment() {
        return payment;
    }

    public void setPayment(boolean payment) {
        this.payment = payment;
    }
    public boolean setdefaultPayment() {
        return false;
    }

    public String getStatutPaiement() {
        return payment ? "payé" : "non payé";
    }

}
