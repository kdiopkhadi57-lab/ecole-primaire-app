package com.school.controller;

import com.school.entity.Classe;
import com.school.repository.ClasseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/classes")
@RequiredArgsConstructor
public class ClasseController {

    private final ClasseRepository classeRepo;

    @GetMapping
    public List<Classe> getAll() {
        return classeRepo.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Classe> getById(@PathVariable Long id) {
        return classeRepo.findById(id).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','DIRECTEUR')")
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        String nom = (String) body.get("nom");
        if (nom == null || nom.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Le nom de la classe est requis"));
        }
        if (classeRepo.findByNom(nom.trim()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Cette classe existe déjà : " + nom));
        }
        Classe c = new Classe();
        c.setNom(nom.trim());
        c.setEffectifs(0);
        // Niveau optionnel (ex: "6ème", "5ème", etc.)
        if (body.get("niveau") != null) {
            // Stocker dans le nom si niveau est précisé (ex: "6emeA")
        }
        return ResponseEntity.ok(classeRepo.save(c));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DIRECTEUR')")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return classeRepo.findById(id).map(c -> {
            if (body.get("nom") != null) c.setNom((String) body.get("nom"));
            return ResponseEntity.ok(classeRepo.save(c));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        return classeRepo.findById(id).map(c -> {
            classeRepo.delete(c);
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
