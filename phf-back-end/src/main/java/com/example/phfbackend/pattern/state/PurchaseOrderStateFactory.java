package com.example.phfbackend.pattern.state;

import com.example.phfbackend.entities.purchase.PurchaseOrderStatus;

import java.util.EnumMap;
import java.util.Map;

/**
 * State Pattern - Factory để tạo state instances
 * Sử dụng singleton pattern để tái sử dụng state instances
 */
public class PurchaseOrderStateFactory {
    
    private static final Map<PurchaseOrderStatus, PurchaseOrderState> states = new EnumMap<>(PurchaseOrderStatus.class);
    
    static {
        states.put(PurchaseOrderStatus.DRAFT, new DraftState());
        states.put(PurchaseOrderStatus.ORDERED, new OrderedState());
        states.put(PurchaseOrderStatus.RECEIVED, new ReceivedState());
        states.put(PurchaseOrderStatus.CANCELLED, new CancelledState());
    }
    
    /**
     * Lấy state instance tương ứng với status
     */
    public static PurchaseOrderState getState(PurchaseOrderStatus status) {
        PurchaseOrderState state = states.get(status);
        if (state == null) {
            throw new IllegalArgumentException("Unknown purchase order status: " + status);
        }
        return state;
    }
}





