package com.school.repository;

import com.school.entity.Devoir;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DevoirRepository extends JpaRepository<Devoir, Long> {
    List<Devoir> findByClasseIdAndAnneeScolOrderByDatePrevueAsc(Long classeId, String anneeScol);
}
