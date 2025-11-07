package com.example.phfbackend.service;

import java.util.UUID;

/**
 * Service interface for Gemini AI integration
 * UC25 - Chỉnh sửa sản phẩm với Gemini
 * UC30 - Thêm đơn đặt hàng nháp với Gemini
 */
public interface GeminiService {
    
    /**
     * UC25 - Chỉnh sửa sản phẩm với Gemini
     * Sử dụng Gemini để hỗ trợ chỉnh sửa thông tin sản phẩm
     * 
     * @param productId ID của sản phẩm cần chỉnh sửa
     * @param userInput Input từ người dùng (mô tả thay đổi)
     * @return Gợi ý chỉnh sửa từ Gemini
     */
    String suggestProductEdit(UUID productId, String userInput);
    
    /**
     * UC30 - Thêm đơn đặt hàng nháp với Gemini
     * Sử dụng Gemini để hỗ trợ tạo đơn đặt hàng
     * 
     * @param userInput Input từ người dùng (mô tả đơn hàng)
     * @return Gợi ý đơn đặt hàng từ Gemini (JSON format)
     */
    String suggestPurchaseOrder(String userInput);
    
    /**
     * General chat method for various queries
     * 
     * @param prompt The user's prompt/question
     * @return Response from Gemini
     */
    String chat(String prompt);
}

