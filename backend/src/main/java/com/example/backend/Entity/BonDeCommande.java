package com.example.backend.Entity;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.Year;
import java.util.Date;


@Entity
@Table(name = "bon_de_commande")
public class BonDeCommande {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Lob
    @Column(nullable = false, length = 16777215)
    private byte[] document;

    @Column(nullable = false, unique = true)
    private String numero;

    @Column(name = "date_creation", nullable = false)
    @Temporal(TemporalType.DATE)
    private Date dateCreation;

    @Column(nullable = false)
    private boolean payment;
    // 0 = false (non payé)
    // 1 = true (payé)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public byte[] getDocument() {
        return document;
    }

    public void setDocument(byte[] document) {
        this.document = document;
    }

    public String getNumero() {
        return numero;
    }

    public void setNumero(String numero) {
        this.numero = numero;
    }

    public Date getDateCreation() {
        return dateCreation;
    }

    public void setDateCreation(Date dateCreation) {
        this.dateCreation = dateCreation;
    }
    public Client getClient() {
        return client;
    }

    public void setClient(Client client) {
        this.client = client;
    }

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
