package com.example.backend.Repositories;

import com.example.backend.Entity.ExportHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExportHistoryRepository extends JpaRepository<ExportHistory, Long> {
    List<ExportHistory> findByFileNameContaining(String searchTerm);
    List<ExportHistory> findAllByOrderByCreationDateDesc();

}
