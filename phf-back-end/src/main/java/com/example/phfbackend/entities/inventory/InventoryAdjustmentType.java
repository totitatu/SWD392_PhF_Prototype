package com.example.phfbackend.entities.inventory;

/**
 * Captures the reason for manual stock corrections to maintain audit trails.
 */
public enum InventoryAdjustmentType {
    COUNT_VARIANCE,
    DAMAGED_GOODS,
    EXPIRED_REMOVAL,
    INITIAL_STOCK,
    OTHER
}
