package com.example.backend.Repositories;

import com.example.backend.Entity.BonDeCommande;
import com.example.backend.Entity.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BonDeCommandeRepository extends JpaRepository<BonDeCommande, Integer> {

    @Query("SELECT MAX(b.numero) FROM BonDeCommande b WHERE YEAR(b.dateCreation) = :year AND MONTH(b.dateCreation) = :month")
    String findLastNumeroForMonth(@Param("year") int year, @Param("month") int month);

    List<BonDeCommande> findByClient(Client client);

    BonDeCommande findByNumeroAndClient(String numero, Client client);

    @Query("SELECT MAX(b.numero) FROM BonDeCommande b WHERE YEAR(b.dateCreation) = YEAR(CURRENT_DATE)")
    Integer findMaxNumeroForCurrentYear();

    @Query("SELECT b FROM BonDeCommande b LEFT JOIN FETCH b.client")
    List<BonDeCommande> findAllWithClient();

    @Query("SELECT b FROM BonDeCommande b LEFT JOIN FETCH b.client WHERE b.payment = true")
    List<BonDeCommande> findPaidWithClient();

    @Query("SELECT b FROM BonDeCommande b LEFT JOIN FETCH b.client WHERE b.payment = false")
    List<BonDeCommande> findUnpaidWithClient();
}