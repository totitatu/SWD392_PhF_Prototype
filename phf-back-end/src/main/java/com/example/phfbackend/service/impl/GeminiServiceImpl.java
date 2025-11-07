package com.example.phfbackend.service.impl;

import com.example.phfbackend.service.GeminiService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Implementation of GeminiService using Google Gemini API
 */
@Slf4j
@Service
public class GeminiServiceImpl implements GeminiService {
    
    @Value("${gemini.api.key}")
    private String geminiApiKey;
    
    @Value("${gemini.enabled:true}")
    private boolean geminiEnabled;
    
    @Value("${gemini.model:gemini-pro}")
    private String model;
    
    private WebClient getWebClient() {
        return WebClient.builder()
                .baseUrl("https://generativelanguage.googleapis.com")
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }
    
    @Override
    public String suggestProductEdit(UUID productId, String userInput) {
        if (!geminiEnabled || geminiApiKey == null || geminiApiKey.isEmpty()) {
            log.warn("Gemini service is not enabled or API key is missing");
            return "Gemini service is not configured. Please configure API key in application.yml";
        }
        
        try {
            String prompt = String.format(
                "Bạn là trợ lý AI cho hệ thống quản lý nhà thuốc. " +
                "Người dùng muốn chỉnh sửa thông tin sản phẩm có ID: %s. " +
                "Yêu cầu của người dùng: %s. " +
                "Hãy đưa ra gợi ý chỉnh sửa chi tiết, bao gồm các trường có thể cần thay đổi như: " +
                "tên sản phẩm, hoạt chất, dạng bào chế, độ mạnh, danh mục, mức tồn kho tối thiểu, v.v. " +
                "Trả về kết quả dưới dạng JSON với các trường đề xuất.",
                productId, userInput
            );
            
            return callGeminiAPI(prompt);
        } catch (Exception e) {
            log.error("Error calling Gemini API for product edit: ", e);
            return "Lỗi khi gọi Gemini API: " + e.getMessage();
        }
    }
    
    @Override
    public String suggestPurchaseOrder(String userInput) {
        if (!geminiEnabled || geminiApiKey == null || geminiApiKey.isEmpty()) {
            log.warn("Gemini service is not enabled or API key is missing");
            return "Gemini service is not configured. Please configure API key in application.yml";
        }
        
        try {
            String prompt = String.format(
                "Bạn là trợ lý AI cho hệ thống quản lý nhà thuốc. " +
                "Người dùng muốn tạo đơn đặt hàng với mô tả: %s. " +
                "Hãy phân tích và đưa ra gợi ý đơn đặt hàng dưới dạng JSON với cấu trúc: " +
                "{\"supplierName\": \"tên nhà cung cấp\", \"orderCode\": \"mã đơn hàng\", " +
                "\"lineItems\": [{\"productName\": \"tên sản phẩm\", \"quantity\": số lượng, \"unitCost\": giá}]}. " +
                "Nếu thiếu thông tin, hãy đưa ra gợi ý hợp lý dựa trên ngữ cảnh nhà thuốc.",
                userInput
            );
            
            return callGeminiAPI(prompt);
        } catch (Exception e) {
            log.error("Error calling Gemini API for purchase order: ", e);
            return "Lỗi khi gọi Gemini API: " + e.getMessage();
        }
    }
    
    private String callGeminiAPI(String prompt) {
        try {
            Map<String, Object> requestBody = new HashMap<>();
            Map<String, Object> content = new HashMap<>();
            Map<String, Object> part = new HashMap<>();
            part.put("text", prompt);
            
            Map<String, Object> contentPart = new HashMap<>();
            contentPart.put("parts", new Object[]{part});
            requestBody.put("contents", new Object[]{contentPart});
            
            String url = String.format(
                "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                model, geminiApiKey
            );
            
            WebClient client = getWebClient();
            
            Map<String, Object> response = client.post()
                    .uri(uriBuilder -> uriBuilder
                            .path("/v1beta/models/{model}:generateContent")
                            .queryParam("key", geminiApiKey)
                            .build(model))
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
            
            if (response != null && response.containsKey("candidates")) {
                @SuppressWarnings("unchecked")
                java.util.List<Map<String, Object>> candidates = (java.util.List<Map<String, Object>>) response.get("candidates");
                if (!candidates.isEmpty()) {
                    Map<String, Object> candidate = candidates.get(0);
                    Map<String, Object> contentMap = (Map<String, Object>) candidate.get("content");
                    @SuppressWarnings("unchecked")
                    java.util.List<Map<String, Object>> parts = (java.util.List<Map<String, Object>>) contentMap.get("parts");
                    if (!parts.isEmpty()) {
                        return (String) parts.get(0).get("text");
                    }
                }
            }
            
            return "Không nhận được phản hồi từ Gemini API";
        } catch (Exception e) {
            log.error("Error calling Gemini API: ", e);
            throw new RuntimeException("Failed to call Gemini API: " + e.getMessage(), e);
        }
    }
    
    @Override
    public String chat(String prompt) {
        if (!geminiEnabled || geminiApiKey == null || geminiApiKey.isEmpty()) {
            log.warn("Gemini service is not enabled or API key is missing");
            return "Gemini service is not configured. Please configure API key in application.yml";
        }
        
        try {
            String fullPrompt = "Bạn là trợ lý AI thông minh cho hệ thống quản lý nhà thuốc. " +
                    "Hãy trả lời câu hỏi hoặc yêu cầu sau một cách hữu ích, chính xác và ngắn gọn: " + prompt;
            return callGeminiAPI(fullPrompt);
        } catch (Exception e) {
            log.error("Error calling Gemini API for chat: ", e);
            return "Lỗi khi gọi Gemini API: " + e.getMessage();
        }
    }
}

