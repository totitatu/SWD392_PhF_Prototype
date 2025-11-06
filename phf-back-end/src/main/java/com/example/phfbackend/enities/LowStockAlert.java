package com.example.phfbackend.enities;

import java.time.LocalDateTime;
import java.util.UUID;

public class LowStockAlert extends Alert{

    private int currentStock;
    private int threshold;

    public LowStockAlert() {
    }

    public LowStockAlert(UUID productId, String productName, LocalDateTime alertDate, int currentStock, int threshold) {
        super(productId, productName, alertDate);
        this.currentStock = currentStock;
        this.threshold = threshold;
    }

    public int getCurrentStock() {
        return currentStock;
    }

    public void setCurrentStock(int currentStock) {
        this.currentStock = currentStock;
    }

    public int getThreshold() {
        return threshold;
    }

    public void setThreshold(int threshold) {
        this.threshold = threshold;
    }
}
