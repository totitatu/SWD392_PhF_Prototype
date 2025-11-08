package com.example.phfbackend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class GeminiResponse {
    private String suggestion;
    private String rawResponse;
    private boolean success;
    private String errorMessage;
}





