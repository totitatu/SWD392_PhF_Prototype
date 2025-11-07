package com.example.phfbackend.dto;

import com.example.phfbackend.entities.purchase.PurchaseOrderStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class PurchaseOrderFilterCriteria {
    private String searchTerm;
    private PurchaseOrderStatus status;
    private UUID supplierId;
    private LocalDate startDate;
    private LocalDate endDate;
}


