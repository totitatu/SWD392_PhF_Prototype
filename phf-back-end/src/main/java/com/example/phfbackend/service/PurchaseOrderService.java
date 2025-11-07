package com.example.phfbackend.service;

import com.example.phfbackend.entities.purchase.PurchaseOrder;
import com.example.phfbackend.entities.purchase.PurchaseOrderStatus;
import com.example.phfbackend.repository.PurchaseOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class PurchaseOrderService {
    
    private final PurchaseOrderRepository purchaseOrderRepository;
    
    public PurchaseOrder createPurchaseOrder(PurchaseOrder order) {
        if (purchaseOrderRepository.findByOrderCode(order.getOrderCode()).isPresent()) {
            throw new IllegalArgumentException("Purchase order with code " + order.getOrderCode() + " already exists");
        }
        return purchaseOrderRepository.save(order);
    }
    
    @Transactional(readOnly = true)
    public Optional<PurchaseOrder> findById(UUID id) {
        return purchaseOrderRepository.findById(id);
    }
    
    @Transactional(readOnly = true)
    public Optional<PurchaseOrder> findByOrderCode(String orderCode) {
        return purchaseOrderRepository.findByOrderCode(orderCode);
    }
    
    @Transactional(readOnly = true)
    public List<PurchaseOrder> findAll() {
        return purchaseOrderRepository.findAll();
    }
    
    @Transactional(readOnly = true)
    public List<PurchaseOrder> findByStatus(PurchaseOrderStatus status) {
        return purchaseOrderRepository.findByStatus(status);
    }
    
    @Transactional(readOnly = true)
    public List<PurchaseOrder> findBySupplierId(UUID supplierId) {
        return purchaseOrderRepository.findBySupplierId(supplierId);
    }
    
    @Transactional(readOnly = true)
    public List<PurchaseOrder> search(String term) {
        return purchaseOrderRepository.searchBySupplierNameOrOrderCode(term);
    }
    
    public PurchaseOrder markOrdered(UUID id, LocalDate expectedDate) {
        PurchaseOrder order = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Purchase order not found: " + id));
        order.markOrdered(expectedDate);
        return purchaseOrderRepository.save(order);
    }
    
    public PurchaseOrder markReceived(UUID id) {
        PurchaseOrder order = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Purchase order not found: " + id));
        order.markReceived();
        return purchaseOrderRepository.save(order);
    }
    
    public PurchaseOrder cancelOrder(UUID id) {
        PurchaseOrder order = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Purchase order not found: " + id));
        order.cancel();
        return purchaseOrderRepository.save(order);
    }
    
    public void deletePurchaseOrder(UUID id) {
        PurchaseOrder order = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Purchase order not found: " + id));
        if (order.getStatus() != PurchaseOrderStatus.DRAFT) {
            throw new IllegalStateException("Only draft orders can be deleted");
        }
        purchaseOrderRepository.delete(order);
    }
}


