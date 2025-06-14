package com.example.backend.Repositories;

import com.example.backend.Entity.Client;
import com.example.backend.Entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface ClientRepository extends JpaRepository<Client, Integer> {
    List<Client> findBySupplierId(Integer supplierId);
    Optional<Client> findByNameAndSupplier(String name, Supplier supplier);
    @Modifying
    @Transactional
    @Query("DELETE FROM Client c WHERE c.supplier = :supplier")
    void deleteBySupplier(@Param("supplier") Supplier supplier);

    List<Client> findBySupplier(Supplier supplier);

    List<Client> findByName(String name);

}
