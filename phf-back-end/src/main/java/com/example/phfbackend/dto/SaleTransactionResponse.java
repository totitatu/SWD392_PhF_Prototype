package com.example.phfbackend.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class SaleTransactionResponse {
    private UUID id;
    private String receiptNumber;
    private OffsetDateTime soldAt;
    private UUID cashierId;
    private String cashierName;
    private List<SaleTransactionLineResponse> lineItems;
    private BigDecimal totalDiscount;
    private BigDecimal totalAmount;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}


