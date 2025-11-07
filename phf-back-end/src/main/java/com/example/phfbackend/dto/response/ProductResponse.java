package com.example.phfbackend.dto;

import com.example.phfbackend.entities.product.ProductCategory;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class ProductResponse {
    private UUID id;
    private String sku;
    private String name;
    private String activeIngredient;
    private String dosageForm;
    private String dosageStrength;
    private ProductCategory category;
    private Integer reorderLevel;
    private Integer expiryAlertDays;
    private String dosage;
    private Integer minStock;
    private boolean active;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}


