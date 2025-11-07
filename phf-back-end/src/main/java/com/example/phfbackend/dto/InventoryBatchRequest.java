package com.example.phfbackend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class InventoryBatchRequest {
    @NotNull(message = "Product ID is required")
    private UUID productId;
    
    @NotBlank(message = "Batch number is required")
    private String batchNumber;
    
    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be positive")
    private Integer quantityOnHand;
    
    @NotNull(message = "Cost price is required")
    @Positive(message = "Cost price must be positive")
    private BigDecimal costPrice;
    
    @NotNull(message = "Received date is required")
    private LocalDate receivedDate;
    
    @NotNull(message = "Expiry date is required")
    private LocalDate expiryDate;
    
    @NotNull(message = "Selling price is required")
    @Positive(message = "Selling price must be positive")
    private BigDecimal sellingPrice;
    
    private Boolean active;
}


