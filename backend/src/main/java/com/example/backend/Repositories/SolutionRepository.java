package com.example.backend.Repositories;

import com.example.backend.Entity.Solution;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SolutionRepository extends JpaRepository<Solution, Integer> {
}