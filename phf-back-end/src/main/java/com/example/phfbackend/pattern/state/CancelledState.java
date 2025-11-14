package com.example.phfbackend.pattern.state;

import com.example.phfbackend.entities.purchase.PurchaseOrder;
import com.example.phfbackend.entities.purchase.PurchaseOrderStatus;

import java.time.LocalDate;

/**
 * State Pattern - Cancelled State
 * Order đã bị hủy, không thể thay đổi nữa
 */
public class CancelledState implements PurchaseOrderState {
    
    @Override
    public PurchaseOrder markOrdered(PurchaseOrder order, LocalDate expectedDate) {
        throw new IllegalStateException("Cannot mark CANCELLED order as ORDERED. Order is cancelled.");
    }
    
    @Override
    public PurchaseOrder markReceived(PurchaseOrder order) {
        throw new IllegalStateException("Cannot mark CANCELLED order as RECEIVED. Order is cancelled.");
    }
    
    @Override
    public PurchaseOrder cancel(PurchaseOrder order) {
        throw new IllegalStateException("Order is already CANCELLED.");
    }
    
    @Override
    public boolean canDelete() {
        return false; // Cancelled orders cannot be deleted (for audit purposes)
    }
    
    @Override
    public boolean canUpdate() {
        return false; // Cancelled orders cannot be updated
    }
    
    @Override
    public PurchaseOrderStatus getStatus() {
        return PurchaseOrderStatus.CANCELLED;
    }
}





