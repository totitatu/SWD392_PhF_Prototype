package com.example.phfbackend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
public class PurchaseOrderRequest {
    @NotBlank(message = "Order code is required")
    private String orderCode;
    
    @NotNull(message = "Supplier ID is required")
    private UUID supplierId;
    
    @NotNull(message = "Order date is required")
    private LocalDate orderDate;
    
    private LocalDate expectedDate;
    
    @NotEmpty(message = "At least one line item is required")
    @Valid
    private List<PurchaseOrderLineRequest> lineItems;
}


