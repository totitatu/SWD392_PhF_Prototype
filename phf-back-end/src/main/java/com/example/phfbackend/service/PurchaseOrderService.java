package com.example.phfbackend.service;

import com.example.phfbackend.dto.PurchaseOrderFilterCriteria;
import com.example.phfbackend.entities.purchase.PurchaseOrder;
import com.example.phfbackend.entities.purchase.PurchaseOrderStatus;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PurchaseOrderService {
    PurchaseOrder createPurchaseOrder(PurchaseOrder order);
    
    Optional<PurchaseOrder> findById(UUID id);
    
    Optional<PurchaseOrder> findByOrderCode(String orderCode);
    
    List<PurchaseOrder> findAll();
    
    List<PurchaseOrder> findByStatus(PurchaseOrderStatus status);
    
    List<PurchaseOrder> findBySupplierId(UUID supplierId);
    
    List<PurchaseOrder> search(String term);
    
    List<PurchaseOrder> filterPurchaseOrders(PurchaseOrderFilterCriteria criteria);
    
    PurchaseOrder markOrdered(UUID id, LocalDate expectedDate);
    
    PurchaseOrder markReceived(UUID id);
    
    PurchaseOrder cancelOrder(UUID id);
    
    PurchaseOrder updateStatus(UUID id, PurchaseOrderStatus status);
    
    void deletePurchaseOrder(UUID id);
}
