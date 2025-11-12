package com.example.phfbackend.pattern.state;

import com.example.phfbackend.entities.purchase.PurchaseOrder;
import com.example.phfbackend.entities.purchase.PurchaseOrderStatus;

import java.time.LocalDate;

/**
 * State Pattern - Interface định nghĩa behavior cho các state của PurchaseOrder
 * Mỗi state sẽ có logic transition riêng
 */
public interface PurchaseOrderState {
    
    /**
     * Chuyển sang trạng thái ORDERED
     */
    PurchaseOrder markOrdered(PurchaseOrder order, LocalDate expectedDate);
    
    /**
     * Chuyển sang trạng thái RECEIVED
     */
    PurchaseOrder markReceived(PurchaseOrder order);
    
    /**
     * Chuyển sang trạng thái CANCELLED
     */
    PurchaseOrder cancel(PurchaseOrder order);
    
    /**
     * Kiểm tra xem có thể xóa order không
     */
    boolean canDelete();
    
    /**
     * Kiểm tra xem có thể cập nhật order không
     */
    boolean canUpdate();
    
    /**
     * Lấy status hiện tại
     */
    PurchaseOrderStatus getStatus();
}




