package com.example.phfbackend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Response DTO for POS product search (UC44)
 * Includes product information with inventory stock quantity and price
 */
@Data
@Builder
public class POSProductResponse {
    private UUID id;
    private String sku;
    private String name;
    private String activeIngredient;
    private String dosageForm;
    private String dosageStrength;
    private String dosage;
    private BigDecimal sellingPrice; // Price from inventory
    private Integer stockQuantity; // Total available stock quantity
    private boolean available; // Whether product is available (stock > 0)
}

