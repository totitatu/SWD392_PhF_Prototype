package com.example.phfbackend.dto.request;

import com.example.phfbackend.entities.sale.PaymentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Request DTO for creating sale transaction (UC46 - Generate Receipt)
 */
@Data
public class SaleTransactionRequest {
    // Receipt number will be auto-generated if not provided
    private String receiptNumber;
    
    @NotNull(message = "Sold at date is required")
    private OffsetDateTime soldAt;
    
    @NotNull(message = "Cashier ID is required")
    private UUID cashierId;
    
    @NotEmpty(message = "At least one line item is required")
    @Valid
    private List<SaleTransactionLineRequest> lineItems;
    
    private BigDecimal totalDiscount;
    
    @NotNull(message = "Payment method is required")
    private PaymentMethod paymentMethod;
    
    // Prescription image URL (required if cart contains prescription products)
    private String prescriptionImageUrl;
    
    // Customer email (for email receipt option)
    @Email(message = "Invalid email format")
    private String customerEmail;
    
    // Whether to email receipt
    private Boolean emailReceipt;
}


