package com.school.repository;

import com.school.entity.ConfigurationSalaire;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ConfigurationSalaireRepository extends JpaRepository<ConfigurationSalaire, Long> {
    Optional<ConfigurationSalaire> findByEnseignantIdAndActif(Long enseignantId, boolean actif);
    Optional<ConfigurationSalaire> findByEnseignantId(Long enseignantId);
}
