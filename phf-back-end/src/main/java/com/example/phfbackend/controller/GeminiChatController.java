package com.example.phfbackend.controller;

import com.example.phfbackend.dto.GeminiRequest;
import com.example.phfbackend.dto.GeminiResponse;
import com.example.phfbackend.service.GeminiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Chat controller for Gemini AI assistant
 * Provides general chat functionality with Gemini
 */
@RestController
@RequestMapping("/api/gemini/chat")
@RequiredArgsConstructor
public class GeminiChatController {
    
    private final GeminiService geminiService;
    
    /**
     * General chat endpoint with Gemini
     * Can be used for various queries related to pharmacy management
     */
    @PostMapping
    public ResponseEntity<GeminiResponse> chat(@Valid @RequestBody GeminiRequest request) {
        try {
            String response = geminiService.chat(request.getUserInput());
            
            GeminiResponse geminiResponse = GeminiResponse.builder()
                    .suggestion(response)
                    .success(true)
                    .build();
            
            return ResponseEntity.ok(geminiResponse);
        } catch (Exception e) {
            GeminiResponse errorResponse = GeminiResponse.builder()
                    .success(false)
                    .errorMessage(e.getMessage())
                    .build();
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    
    /**
     * Chat with context about a specific product
     */
    @PostMapping("/product/{productId}")
    public ResponseEntity<GeminiResponse> chatAboutProduct(
            @PathVariable UUID productId,
            @Valid @RequestBody GeminiRequest request) {
        try {
            String response = geminiService.suggestProductEdit(productId, request.getUserInput());
            
            GeminiResponse geminiResponse = GeminiResponse.builder()
                    .suggestion(response)
                    .success(true)
                    .build();
            
            return ResponseEntity.ok(geminiResponse);
        } catch (Exception e) {
            GeminiResponse errorResponse = GeminiResponse.builder()
                    .success(false)
                    .errorMessage(e.getMessage())
                    .build();
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
}

