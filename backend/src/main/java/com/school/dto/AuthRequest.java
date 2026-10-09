package com.school.dto;

import lombok.Data;

@Data
public class AuthRequest {
    private String username;
    private String password;
    private String matricule;
    private String telephoneParent;
}
