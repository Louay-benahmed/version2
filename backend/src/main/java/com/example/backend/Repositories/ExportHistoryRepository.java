package com.example.backend.Repositories;

import com.example.backend.Entity.ExportHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ExportHistoryRepository extends JpaRepository<ExportHistory, Long> {
    List<ExportHistory> findByFileNameContaining(String searchTerm);
    List<ExportHistory> findAllByOrderByCreationDateDesc();
    List<ExportHistory> findByFileNameStartingWithOrderByCreationDateDesc(String prefix);
    @Query("SELECT eh FROM ExportHistory eh WHERE eh.fileName NOT LIKE CONCAT(:prefix, '%') ORDER BY eh.creationDate DESC")
    List<ExportHistory> findByFileNameNotStartingWithOrderByCreationDateDesc(@Param("prefix") String prefix);}
