package com.example.backend.Entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

import java.math.BigInteger;
import java.util.*;

@Entity
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})

public class Supplier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(unique = true, nullable = false)
    @Size(min = 2, max = 100)
    private String name;


    @Column(unique = false, nullable = true)
    private String email;

    @Column(nullable = true)
    private String matricule_fiscale;

    @Column(nullable = true)
    private String adress;

    @Column(nullable = true)
    @Temporal(TemporalType.DATE)
    private Date dateDeContrat;

    @Column(nullable = true, unique = false, columnDefinition = "NUMERIC(30,0)")
    private BigInteger RIB;

    @OneToMany(mappedBy = "supplier", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<Client> clients = new ArrayList<>();

    @ManyToMany
    @JoinTable(
            name = "supplier_solution",
            joinColumns = @JoinColumn(name = "supplier_id"),
            inverseJoinColumns = @JoinColumn(name = "solution_id")
    )
    @JsonIgnoreProperties("suppliers")
    private Set<Solution> solutions = new HashSet<>();



    @OneToMany(mappedBy = "supplier", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Facture> factures = new ArrayList<>();

    public List<Facture> getFactures() {
        return factures;
    }

    public void addFacture(Facture facture) {
        factures.add(facture);
        facture.setSupplier(this);
    }

    public void removeFacture(Facture facture) {
        factures.remove(facture);
        facture.setSupplier(null);
    }


    public void addSolution(Solution solution) {
        this.solutions.add(solution);
        solution.getSuppliers().add(this);
    }

    public void removeSolution(Solution solution) {
        this.solutions.remove(solution);
        solution.getSuppliers().remove(this);
    }

    public Set<Solution> getSolutions() {
        return solutions;
    }

    public void setSolutions(Set<Solution> solutions) {
        this.solutions = solutions;
    }

    public Supplier() {}

    public Supplier(String name, String email) {
        this.name = name;
        this.email = email;
    }

    public Supplier(String name, String email, String matricule_fiscale, String adress) {
        this.name = name;
        this.email = email;
        this.matricule_fiscale = matricule_fiscale;
        this.adress = adress;
    }

    public Supplier(String name, String email, String matricule_fiscale, String adress, Date dateDeContrat, BigInteger RIB) {
        this.name = name;
        this.email = email;
        this.matricule_fiscale = matricule_fiscale;
        this.adress = adress;
        this.dateDeContrat = dateDeContrat;
        this.RIB = RIB;
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

    public List<Client> getClients() { return clients; }
    public void setClients(List<Client> clients) { this.clients = clients; }


    public Date getDateDeContrat() {
        return dateDeContrat;
    }

    public void setDateDeContrat(Date dateDeContrat) {
        this.dateDeContrat = dateDeContrat;
    }

    public BigInteger getRIB() {
        return RIB;
    }

    public void setRIB(BigInteger RIB) {
        this.RIB = RIB;
    }

    @Override
    public String toString() {
        return "Supplier{name='" + name + "', email='" + email + "', matricule_fiscale='" + matricule_fiscale +
                "', adress='" + adress + "', dateDeContrat='" + dateDeContrat + "', RIB='" + RIB + "'}";
    }
}