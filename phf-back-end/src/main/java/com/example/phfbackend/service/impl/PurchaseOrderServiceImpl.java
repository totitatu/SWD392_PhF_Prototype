package com.example.phfbackend.service.impl;

import com.example.phfbackend.dto.PurchaseOrderFilterCriteria;
import com.example.phfbackend.entities.purchase.PurchaseOrder;
import com.example.phfbackend.entities.purchase.PurchaseOrderStatus;
import com.example.phfbackend.repository.PurchaseOrderRepository;
import com.example.phfbackend.service.PurchaseOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Transactional
public class PurchaseOrderServiceImpl implements PurchaseOrderService {
    
    private final PurchaseOrderRepository purchaseOrderRepository;
    
    @Override
    public PurchaseOrder createPurchaseOrder(PurchaseOrder order) {
        if (purchaseOrderRepository.findByOrderCode(order.getOrderCode()).isPresent()) {
            throw new IllegalArgumentException("Purchase order with code " + order.getOrderCode() + " already exists");
        }
        return purchaseOrderRepository.save(order);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<PurchaseOrder> findById(UUID id) {
        return purchaseOrderRepository.findByIdWithRelations(id);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<PurchaseOrder> findByOrderCode(String orderCode) {
        return purchaseOrderRepository.findByOrderCode(orderCode);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<PurchaseOrder> findAll() {
        return purchaseOrderRepository.findAllWithRelations();
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<PurchaseOrder> findByStatus(PurchaseOrderStatus status) {
        return purchaseOrderRepository.findByStatus(status);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<PurchaseOrder> findBySupplierId(UUID supplierId) {
        return purchaseOrderRepository.findBySupplierId(supplierId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<PurchaseOrder> search(String term) {
        return purchaseOrderRepository.searchBySupplierNameOrOrderCode(term);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<PurchaseOrder> filterPurchaseOrders(PurchaseOrderFilterCriteria criteria) {
        Stream<PurchaseOrder> stream = purchaseOrderRepository.findAllWithRelations().stream();
        
        if (criteria.getSearchTerm() != null && !criteria.getSearchTerm().trim().isEmpty()) {
            String term = criteria.getSearchTerm().trim().toLowerCase();
            stream = stream.filter(order -> 
                order.getOrderCode().toLowerCase().contains(term) ||
                order.getSupplier().getName().toLowerCase().contains(term)
            );
        }
        
        if (criteria.getStatus() != null) {
            stream = stream.filter(order -> order.getStatus() == criteria.getStatus());
        }
        
        if (criteria.getSupplierId() != null) {
            stream = stream.filter(order -> order.getSupplier().getId().equals(criteria.getSupplierId()));
        }
        
        if (criteria.getStartDate() != null) {
            stream = stream.filter(order -> !order.getOrderDate().isBefore(criteria.getStartDate()));
        }
        
        if (criteria.getEndDate() != null) {
            stream = stream.filter(order -> !order.getOrderDate().isAfter(criteria.getEndDate()));
        }
        
        return stream.toList();
    }
    
    @Override
    public PurchaseOrder markOrdered(UUID id, LocalDate expectedDate) {
        PurchaseOrder order = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Purchase order not found: " + id));
        if (order.getStatus() != PurchaseOrderStatus.DRAFT) {
            throw new IllegalStateException("Only draft orders can be sent");
        }
        order.markOrdered(expectedDate);
        return purchaseOrderRepository.save(order);
    }
    
    @Override
    public PurchaseOrder markReceived(UUID id) {
        PurchaseOrder order = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Purchase order not found: " + id));
        order.markReceived();
        return purchaseOrderRepository.save(order);
    }
    
    @Override
    public PurchaseOrder cancelOrder(UUID id) {
        PurchaseOrder order = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Purchase order not found: " + id));
        order.cancel();
        return purchaseOrderRepository.save(order);
    }
    
    @Override
    public PurchaseOrder updateStatus(UUID id, PurchaseOrderStatus status) {
        PurchaseOrder order = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Purchase order not found: " + id));
        
        // Use appropriate method based on status
        switch (status) {
            case DRAFT:
                // Can't revert to draft, but allow if already draft
                if (order.getStatus() != PurchaseOrderStatus.DRAFT) {
                    throw new IllegalStateException("Cannot change status to DRAFT");
                }
                break;
            case ORDERED:
                if (order.getStatus() == PurchaseOrderStatus.DRAFT) {
                    order.markOrdered(null);
                } else {
                    throw new IllegalStateException("Can only mark DRAFT orders as ORDERED");
                }
                break;
            case RECEIVED:
                if (order.getStatus() == PurchaseOrderStatus.ORDERED) {
                    order.markReceived();
                } else {
                    throw new IllegalStateException("Can only mark ORDERED orders as RECEIVED");
                }
                break;
            case CANCELLED:
                order.cancel();
                break;
        }
        
        return purchaseOrderRepository.save(order);
    }
    
    @Override
    public void deletePurchaseOrder(UUID id) {
        PurchaseOrder order = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Purchase order not found: " + id));
        if (order.getStatus() != PurchaseOrderStatus.DRAFT) {
            throw new IllegalStateException("Only draft orders can be deleted");
        }
        purchaseOrderRepository.delete(order);
    }
}



