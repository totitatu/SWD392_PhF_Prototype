package com.example.phfbackend.enities;

import java.time.LocalDateTime;
import java.util.UUID;

public abstract class Alert {
    private UUID productId;
    private String productName;
    private LocalDateTime alertDate;

    public Alert() {
    }

    public Alert(UUID productId, String productName, LocalDateTime alertDate) {
        this.productId = productId;
        this.productName = productName;
        this.alertDate = alertDate;
    }

    public UUID getProductId() {
        return productId;
    }

    public void setProductId(UUID productId) {
        this.productId = productId;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public LocalDateTime getAlertDate() {
        return alertDate;
    }

    public void setAlertDate(LocalDateTime alertDate) {
        this.alertDate = alertDate;
    }

}
