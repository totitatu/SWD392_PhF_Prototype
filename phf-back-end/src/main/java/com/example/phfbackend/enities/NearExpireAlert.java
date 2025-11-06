package com.example.phfbackend.enities;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public class NearExpireAlert extends Alert{

    private Stock stock;
    private LocalDate expireDate;
    private int expiryWindow;

    public NearExpireAlert() {
    }

    public NearExpireAlert(UUID productId, String productName, LocalDateTime alertDate, Stock stock, LocalDate expireDate, int expiryWindow) {
        super(productId, productName, alertDate);
        this.stock = stock;
        this.expireDate = expireDate;
        this.expiryWindow = expiryWindow;
    }

    public Stock getStock() {
        return stock;
    }

    public void setStock(Stock stock) {
        this.stock = stock;
    }

    public LocalDate getExpireDate() {
        return expireDate;
    }

    public void setExpireDate(LocalDate expireDate) {
        this.expireDate = expireDate;
    }

    public int getExpiryWindow() {
        return expiryWindow;
    }

    public void setExpiryWindow(int expiryWindow) {
        this.expiryWindow = expiryWindow;
    }
}
