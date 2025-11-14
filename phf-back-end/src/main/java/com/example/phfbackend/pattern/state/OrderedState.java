package com.example.phfbackend.pattern.state;

import com.example.phfbackend.entities.purchase.PurchaseOrder;
import com.example.phfbackend.entities.purchase.PurchaseOrderStatus;

import java.time.LocalDate;

/**
 * State Pattern - Ordered State
 * Order đã được gửi đi, có thể nhận hàng hoặc hủy
 */
public class OrderedState implements PurchaseOrderState {
    
    @Override
    public PurchaseOrder markOrdered(PurchaseOrder order, LocalDate expectedDate) {
        throw new IllegalStateException("Order is already ORDERED. Cannot mark as ORDERED again.");
    }
    
    @Override
    public PurchaseOrder markReceived(PurchaseOrder order) {
        order.markReceived();
        return order;
    }
    
    @Override
    public PurchaseOrder cancel(PurchaseOrder order) {
        order.cancel();
        return order;
    }
    
    @Override
    public boolean canDelete() {
        return false; // Ordered orders cannot be deleted
    }
    
    @Override
    public boolean canUpdate() {
        return false; // Ordered orders cannot be updated
    }
    
    @Override
    public PurchaseOrderStatus getStatus() {
        return PurchaseOrderStatus.ORDERED;
    }
}





