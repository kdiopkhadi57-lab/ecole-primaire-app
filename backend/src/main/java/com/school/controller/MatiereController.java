package com.school.controller;

import com.school.entity.Matiere;
import com.school.repository.MatiereRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/matieres")
@RequiredArgsConstructor
public class MatiereController {

    private final MatiereRepository matiereRepo;

    @GetMapping
    public List<Matiere> getAll() {
        return matiereRepo.findAll();
    }

    @PostMapping
    public Matiere create(@RequestBody Matiere matiere) {
        return matiereRepo.save(matiere);
    }

    @PutMapping("/{id}")
    public Matiere update(@PathVariable Long id, @RequestBody Matiere matiere) {
        matiere.setId(id);
        return matiereRepo.save(matiere);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        matiereRepo.deleteById(id);
    }
}
