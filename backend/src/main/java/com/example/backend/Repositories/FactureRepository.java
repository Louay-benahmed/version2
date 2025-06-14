package com.example.backend.Repositories;

import com.example.backend.Entity.Facture;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FactureRepository extends JpaRepository<Facture, Integer> {

    @Query("SELECT MAX(f.numero) FROM Facture f WHERE YEAR(f.dateCreation) = YEAR(CURRENT_DATE)")
    Integer findMaxNumeroForCurrentYear();

    @Query("SELECT f FROM Facture f LEFT JOIN FETCH f.supplier")
    List<Facture> findAllWithSupplier();

    @Query("SELECT f FROM Facture f LEFT JOIN FETCH f.supplier WHERE f.payment = true")
    List<Facture> findPaidWithSupplier();

    @Query("SELECT f FROM Facture f LEFT JOIN FETCH f.supplier WHERE f.payment = false")
    List<Facture> findUnpaidWithSupplier();
}