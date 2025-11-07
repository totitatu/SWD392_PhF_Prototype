package com.example.phfbackend.dto;

import com.example.phfbackend.entities.product.ProductCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ProductRequest {
    @NotBlank(message = "SKU is required")
    private String sku;
    
    @NotBlank(message = "Name is required")
    private String name;
    
    @NotBlank(message = "Active ingredient is required")
    private String activeIngredient;
    
    @NotBlank(message = "Dosage form is required")
    private String dosageForm;
    
    @NotBlank(message = "Dosage strength is required")
    private String dosageStrength;
    
    @NotNull(message = "Category is required")
    private ProductCategory category;
    
    private Integer reorderLevel;
    private Integer expiryAlertDays;
    private String dosage;
    private Integer minStock;
    private Boolean active;
}


