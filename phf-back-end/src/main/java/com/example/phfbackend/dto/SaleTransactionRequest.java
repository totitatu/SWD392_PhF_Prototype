package com.example.phfbackend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class SaleTransactionRequest {
    @NotBlank(message = "Receipt number is required")
    private String receiptNumber;
    
    @NotNull(message = "Sold at date is required")
    private OffsetDateTime soldAt;
    
    @NotNull(message = "Cashier ID is required")
    private UUID cashierId;
    
    @NotEmpty(message = "At least one line item is required")
    @Valid
    private List<SaleTransactionLineRequest> lineItems;
    
    private BigDecimal totalDiscount;
}


