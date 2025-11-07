package com.example.phfbackend.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class PurchaseOrderLineResponse {
    private UUID id;
    private UUID productId;
    private String productName;
    private String productSku;
    private Integer lineNumber;
    private Integer quantity;
    private BigDecimal unitCost;
    private BigDecimal lineTotal;
}


