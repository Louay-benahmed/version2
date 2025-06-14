package com.example.backend.Entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

@Entity
public class Solution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 255)
    private String description;

    @Column(nullable = false)
    private Float prix;

    @Column(precision = 5, scale = 2)
    @DecimalMin(value = "0.00", message = "Tax must be between 0 and 100")
    @DecimalMax(value = "100.00", message = "Tax must be between 0 and 100")
    private BigDecimal tax;

    @ManyToMany(mappedBy = "solutions")
    @JsonIgnoreProperties("solutions")
    private Set<Supplier> suppliers = new HashSet<>();

    public Solution() {}

    public Solution(String description, Float prix, BigDecimal tax) {
        this.description = description;
        this.prix = prix;
        this.tax = tax;
    }


    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Float getPrix() {
        return prix;
    }

    public void setPrix(Float prix) {
        this.prix = prix;
    }

    public BigDecimal getTax() {
        return tax;
    }

    public void setTax(BigDecimal tax) {
        this.tax = tax;
    }

    public Set<Supplier> getSuppliers() {
        return suppliers;
    }

    public void setSuppliers(Set<Supplier> suppliers) {
        this.suppliers = suppliers;
    }

    @Override
    public String toString() {
        return "Solution{" +
                "id=" + id +
                ", description='" + description + '\'' +
                ", prix=" + prix +
                ", tax=" + tax +
                '}';
    }
}