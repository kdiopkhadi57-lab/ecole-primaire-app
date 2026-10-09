package com.school.repository;

import com.school.entity.Classe;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ClasseRepository extends JpaRepository<Classe, Long> {
    Optional<Classe> findByNom(String nom);
}
