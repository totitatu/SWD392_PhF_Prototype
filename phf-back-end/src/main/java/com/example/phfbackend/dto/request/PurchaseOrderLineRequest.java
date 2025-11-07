package com.example.phfbackend.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class PurchaseOrderLineRequest {
    @NotNull(message = "Product ID is required")
    private UUID productId;
    
    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be positive")
    private Integer quantity;
    
    @NotNull(message = "Unit cost is required")
    @Positive(message = "Unit cost must be positive")
    private BigDecimal unitCost;
}


