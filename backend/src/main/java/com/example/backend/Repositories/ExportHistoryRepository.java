package com.example.backend.Repositories;

import com.example.backend.Entity.ExportHistory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExportHistoryRepository extends JpaRepository<ExportHistory, Long> {
}
