package com.example.backend.Repositories;
import com.example.backend.Entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SupplierRepository extends JpaRepository<Supplier, Integer> {
    Optional<Supplier> findByName(String name); // Needed for Excel import
    List<Supplier> findByNameIn(List<String> names);
    @Query("SELECT DISTINCT s FROM Supplier s " +
            "LEFT JOIN FETCH s.clients c " +
            "LEFT JOIN FETCH c.excelData " +
            "ORDER BY s.name")
    List<Supplier> findAllWithClientsAndExcelData();
    @Query("SELECT s FROM Supplier s LEFT JOIN FETCH s.clients c LEFT JOIN FETCH c.excelData WHERE s.id = :id")
    Optional<Supplier> findByIdWithClientsAndExcelData(@Param("id") Integer id);
}