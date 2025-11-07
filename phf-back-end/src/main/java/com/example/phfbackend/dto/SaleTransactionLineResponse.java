package com.example.phfbackend.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class SaleTransactionLineResponse {
    private UUID id;
    private UUID inventoryBatchId;
    private String batchNumber;
    private UUID productId;
    private String productName;
    private String productSku;
    private Integer lineNumber;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal discount;
    private BigDecimal lineTotal;
}


