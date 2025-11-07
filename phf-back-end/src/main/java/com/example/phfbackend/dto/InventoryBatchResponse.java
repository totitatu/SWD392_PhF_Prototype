package com.example.phfbackend.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class InventoryBatchResponse {
    private UUID id;
    private UUID productId;
    private String productName;
    private String productSku;
    private String batchNumber;
    private Integer quantityOnHand;
    private BigDecimal costPrice;
    private BigDecimal sellingPrice;
    private LocalDate receivedDate;
    private LocalDate expiryDate;
    private boolean active;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}


