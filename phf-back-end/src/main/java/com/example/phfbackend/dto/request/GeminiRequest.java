package com.example.phfbackend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GeminiRequest {
    @NotBlank(message = "User input is required")
    private String userInput;
    
    private String context; // Additional context if needed
}


