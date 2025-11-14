package com.example.phfbackend.pattern.state;

import com.example.phfbackend.entities.purchase.PurchaseOrder;
import com.example.phfbackend.entities.purchase.PurchaseOrderStatus;

import java.time.LocalDate;

/**
 * State Pattern - Received State
 * Order đã nhận hàng, không thể thay đổi nữa
 */
public class ReceivedState implements PurchaseOrderState {
    
    @Override
    public PurchaseOrder markOrdered(PurchaseOrder order, LocalDate expectedDate) {
        throw new IllegalStateException("Cannot mark RECEIVED order as ORDERED. Order is already completed.");
    }
    
    @Override
    public PurchaseOrder markReceived(PurchaseOrder order) {
        throw new IllegalStateException("Order is already RECEIVED.");
    }
    
    @Override
    public PurchaseOrder cancel(PurchaseOrder order) {
        throw new IllegalStateException("Cannot cancel RECEIVED order. Order is already completed.");
    }
    
    @Override
    public boolean canDelete() {
        return false; // Received orders cannot be deleted
    }
    
    @Override
    public boolean canUpdate() {
        return false; // Received orders cannot be updated
    }
    
    @Override
    public PurchaseOrderStatus getStatus() {
        return PurchaseOrderStatus.RECEIVED;
    }
}





