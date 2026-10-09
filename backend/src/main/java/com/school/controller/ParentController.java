package com.school.controller;

import com.school.entity.Eleve;
import com.school.entity.User;
import com.school.repository.BulletinRepository;
import com.school.repository.DevoirRepository;
import com.school.repository.NoteRepository;
import com.school.repository.PaiementEleveRepository;
import com.school.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/parent")
@RequiredArgsConstructor
public class ParentController {
    private final UserRepository userRepository;
    private final NoteRepository noteRepository;
    private final BulletinRepository bulletinRepository;
    private final DevoirRepository devoirRepository;
    private final PaiementEleveRepository paiementEleveRepository;

    @GetMapping("/portal")
    @PreAuthorize("hasRole('PARENT')")
    public Map<String, Object> getPortal(Authentication authentication) {
        User parent = userRepository.findByUsername(authentication.getName()).orElseThrow();
        Eleve eleve = parent.getParentEleve();
        if (eleve == null) {
            throw new IllegalStateException("Aucun élève n'est associé à ce compte parent");
        }

        String anneeScol = currentSchoolYear();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("anneeScol", anneeScol);
        result.put("eleve", eleve);
        result.put("notes", noteRepository.findByEleveIdAndAnneeScol(eleve.getId(), anneeScol));
        result.put("bulletins", bulletinRepository.findByEleveIdAndAnneeScol(eleve.getId(), anneeScol));
        result.put("devoirs", devoirRepository.findByClasseIdAndAnneeScolOrderByDatePrevueAsc(
                eleve.getClasse().getId(), anneeScol));
        result.put("paiements", paiementEleveRepository.findByEleveIdAndAnneeScol(eleve.getId(), anneeScol));
        return result;
    }

    private String currentSchoolYear() {
        LocalDate today = LocalDate.now();
        int startYear = today.getMonthValue() >= 9 ? today.getYear() : today.getYear() - 1;
        return startYear + "-" + (startYear + 1);
    }
}
