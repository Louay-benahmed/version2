package com.example.backend.Repositories;
import com.example.backend.Entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SupplierRepository extends JpaRepository<Supplier, Integer> {
    Optional<Supplier> findByName(String name); // Needed for Excel import
    List<Supplier> findByNameIn(List<String> names);

}