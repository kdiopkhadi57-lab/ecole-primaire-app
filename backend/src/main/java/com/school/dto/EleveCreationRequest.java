package com.school.dto;

import com.school.entity.Eleve;
import lombok.Data;

@Data
public class EleveCreationRequest {
    private Eleve eleve;
    private Double montantPayeInscription;
    private Double montantPayeOctobre;
    private boolean anneeCompletePayee;
}