package com.school.controller;

import com.school.dto.AuthRequest;
import com.school.dto.AuthResponse;
import com.school.entity.Eleve;
import com.school.entity.Role;
import com.school.entity.User;
import com.school.repository.EleveRepository;
import com.school.repository.UserRepository;
import com.school.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authManager;
    private final UserDetailsService userDetailsService;
    private final JwtUtil jwtUtil;
    private final EleveRepository eleveRepository;
    private final UserRepository userRepository;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        authManager.authenticate(new UsernamePasswordAuthenticationToken(
                request.getUsername(), request.getPassword()));
        UserDetails userDetails = userDetailsService.loadUserByUsername(request.getUsername());
        String token = jwtUtil.generateToken(userDetails);
        return ResponseEntity.ok(new AuthResponse(token, request.getUsername(),
                userDetails.getAuthorities().iterator().next().getAuthority()));
    }

            @PostMapping("/parent-login")
            public ResponseEntity<AuthResponse> parentLogin(@RequestBody AuthRequest request) {
            Eleve eleve = eleveRepository.findByMatricule(request.getMatricule())
                .filter(Eleve::isActif)
                .filter(e -> request.getTelephoneParent() != null
                    && request.getTelephoneParent().equals(e.getTelephoneParent()))
                .orElseThrow(() -> new org.springframework.security.authentication.BadCredentialsException(
                    "Matricule ou téléphone parent incorrect"));

            String username = "parent_" + eleve.getMatricule();
            User parent = userRepository.findByUsername(username).orElseGet(() -> {
                User created = new User();
                created.setUsername(username);
                created.setPassword("{noop}parent-portal");
                created.setPrenom(eleve.getNomPere() != null ? eleve.getNomPere() : "Parent");
                created.setNom(eleve.getNom());
                created.setTelephone(eleve.getTelephoneParent());
                created.setRole(Role.PARENT);
                created.setActif(true);
                created.setParentEleve(eleve);
                return userRepository.save(created);
            });

            UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                .username(parent.getUsername())
                .password(parent.getPassword())
                .roles(Role.PARENT.name())
                .build();
            return ResponseEntity.ok(new AuthResponse(
                jwtUtil.generateToken(userDetails), parent.getUsername(), "ROLE_PARENT"));
            }
}
