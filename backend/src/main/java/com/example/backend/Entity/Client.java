package com.example.backend.Entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.Size;

import java.util.List;

@Entity
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(unique = false, nullable = false)
    @Size(min = 2, max = 100)
    private String name;

    @Column(unique = false, nullable = true)
    private String email;

    @Column(nullable = true)
    private String matricule_fiscale;

    @Column(nullable = true)
    private String adress;

    @Column(nullable = true, unique = false)
        private Integer uniqueIdentifier;

    @ManyToOne
    @JoinColumn(name = "supplier_id", nullable = false)
    @JsonIgnore
    private Supplier supplier;

    @OneToMany(mappedBy = "client", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<BonDeCommande> bonDeCommandes;


    @Embedded
    private ClientExcelData excelData;


    public Client() {}

    public Client(String name, String email, Supplier supplier) {
        this.name = name;
        this.email = email;
        this.supplier = supplier;
    }

    public Client(String name, String email, String matricule_fiscale,
                  String adress, Integer uniqueIdentifier, Supplier supplier) {
        this.name = name;
        this.email = email;
        this.matricule_fiscale = matricule_fiscale;
        this.adress = adress;
        this.uniqueIdentifier = uniqueIdentifier;
        this.supplier = supplier;
    }



    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getMatricule_fiscale() { return matricule_fiscale; }
    public void setMatricule_fiscale(String matricule_fiscale) { this.matricule_fiscale = matricule_fiscale; }
    public String getAdress() { return adress; }
    public void setAdress(String adress) { this.adress = adress; }
    public Integer getUniqueIdentifier() { return uniqueIdentifier; }  // Updated getter
    public void setUniqueIdentifier(Integer uniqueIdentifier) { this.uniqueIdentifier = uniqueIdentifier; }  // Updated setter
    public Supplier getSupplier() { return supplier; }
    public void setSupplier(Supplier supplier) { this.supplier = supplier; }
    public List<BonDeCommande> getBonDeCommandes() {
        return bonDeCommandes;
    }

    public void setBonDeCommandes(List<BonDeCommande> bonDeCommandes) {
        this.bonDeCommandes = bonDeCommandes;
    }
    public ClientExcelData getExcelData() {
        return excelData;
    }

    public void setExcelData(ClientExcelData excelData) {
        this.excelData = excelData;
    }

    public void updateSynchronizedFields(Client source) {
        this.name = source.getName();
        this.email = source.getEmail();
        this.matricule_fiscale = source.getMatricule_fiscale();
        this.adress = source.getAdress();
        this.uniqueIdentifier = source.getUniqueIdentifier();
    }


    @Override
    public String toString() {
        return "Client{name='" + name + "', email='" + email + "', matricule_fiscale='" + matricule_fiscale +
                "', adress='" + adress + "', uniqueIdentifier=" + uniqueIdentifier + "}";
    }
}