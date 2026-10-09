package com.school.controller;

import com.school.entity.Role;
import com.school.entity.User;
import com.school.repository.ClasseRepository;
import com.school.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepo;
    private final ClasseRepository classeRepo;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECTEUR')")
    public List<User> getAll(@RequestParam(required = false) String role) {
        List<User> users = userRepo.findAll();
        if (role != null) {
            return users.stream()
                    .filter(u -> u.getRole().name().equalsIgnoreCase(role))
                    .toList();
        }
        return users;
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getById(@PathVariable Long id) {
        return userRepo.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECTEUR')")
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        if (userRepo.existsByUsername((String) body.get("username"))) {
            return ResponseEntity.badRequest().body(Map.of("error", "Nom d'utilisateur déjà utilisé"));
        }
        User user = new User();
        user.setUsername((String) body.get("username"));
        user.setPassword(passwordEncoder.encode((String) body.get("password")));
        user.setPrenom((String) body.get("prenom"));
        user.setNom((String) body.get("nom"));
        user.setEmail((String) body.get("email"));
        user.setTelephone((String) body.get("telephone"));
        user.setRole(Role.valueOf((String) body.get("role")));
        user.setActif(true);
        if (body.get("classeId") != null) {
            Long classeId = Long.valueOf(body.get("classeId").toString());
            classeRepo.findById(classeId).ifPresent(user::setClasse);
        }
        return ResponseEntity.ok(userRepo.save(user));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECTEUR')")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return userRepo.findById(id).map(user -> {
            if (body.get("prenom") != null) user.setPrenom((String) body.get("prenom"));
            if (body.get("nom") != null) user.setNom((String) body.get("nom"));
            if (body.get("email") != null) user.setEmail((String) body.get("email"));
            if (body.get("telephone") != null) user.setTelephone((String) body.get("telephone"));
            if (body.get("role") != null) user.setRole(Role.valueOf((String) body.get("role")));
            if (body.get("password") != null && !((String)body.get("password")).isBlank()) {
                user.setPassword(passwordEncoder.encode((String) body.get("password")));
            }
            if (body.get("classeId") != null) {
                Long classeId = Long.valueOf(body.get("classeId").toString());
                classeRepo.findById(classeId).ifPresent(user::setClasse);
            } else {
                user.setClasse(null);
            }
            return ResponseEntity.ok(userRepo.save(user));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        return userRepo.findById(id).map(u -> {
            u.setActif(false);
            userRepo.save(u);
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
