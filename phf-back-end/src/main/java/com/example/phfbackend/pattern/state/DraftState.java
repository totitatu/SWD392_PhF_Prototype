package com.example.phfbackend.pattern.state;

import com.example.phfbackend.entities.purchase.PurchaseOrder;
import com.example.phfbackend.entities.purchase.PurchaseOrderStatus;

import java.time.LocalDate;

/**
 * State Pattern - Draft State
 * Order ở trạng thái nháp, có thể chỉnh sửa, gửi đi, hoặc hủy
 */
public class DraftState implements PurchaseOrderState {
    
    @Override
    public PurchaseOrder markOrdered(PurchaseOrder order, LocalDate expectedDate) {
        order.markOrdered(expectedDate);
        return order;
    }
    
    @Override
    public PurchaseOrder markReceived(PurchaseOrder order) {
        throw new IllegalStateException("Cannot mark DRAFT order as RECEIVED. Order must be ORDERED first.");
    }
    
    @Override
    public PurchaseOrder cancel(PurchaseOrder order) {
        order.cancel();
        return order;
    }
    
    @Override
    public boolean canDelete() {
        return true; // Draft orders can be deleted
    }
    
    @Override
    public boolean canUpdate() {
        return true; // Draft orders can be updated
    }
    
    @Override
    public PurchaseOrderStatus getStatus() {
        return PurchaseOrderStatus.DRAFT;
    }
}





