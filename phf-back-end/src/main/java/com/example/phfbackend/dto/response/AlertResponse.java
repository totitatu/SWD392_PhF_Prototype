package com.example.phfbackend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Response DTO for alerts (low stock and expiry)
 */
@Data
@Builder
public class AlertResponse {
    private String type; // "low-stock" or "expiry"
    private String severity; // "critical" or "warning"
    private UUID productId;
    private String productName;
    private String productSku;
    private UUID inventoryBatchId;
    private String batchNumber;
    private Integer currentStock;
    private Integer threshold; // reorderLevel or minStock for low stock
    private LocalDate expiryDate;
    private Integer daysUntilExpiry;
    private String message;
}


