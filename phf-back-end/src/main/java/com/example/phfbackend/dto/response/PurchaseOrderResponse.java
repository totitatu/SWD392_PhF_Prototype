package com.example.phfbackend.dto.response;

import com.example.phfbackend.entities.purchase.PurchaseOrderStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class PurchaseOrderResponse {
    private UUID id;
    private String orderCode;
    private UUID supplierId;
    private String supplierName;
    private PurchaseOrderStatus status;
    private LocalDate orderDate;
    private LocalDate expectedDate;
    private List<PurchaseOrderLineResponse> lineItems;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}


