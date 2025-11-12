package com.example.phfbackend.service.impl;

import com.example.phfbackend.dto.PurchaseOrderFilterCriteria;
import com.example.phfbackend.entities.inventory.InventoryBatch;
import com.example.phfbackend.entities.purchase.PurchaseOrder;
import com.example.phfbackend.entities.purchase.PurchaseOrderLine;
import com.example.phfbackend.entities.purchase.PurchaseOrderStatus;
import com.example.phfbackend.pattern.state.PurchaseOrderState;
import com.example.phfbackend.pattern.state.PurchaseOrderStateFactory;
import com.example.phfbackend.repository.PurchaseOrderRepository;
import com.example.phfbackend.service.InventoryBatchService;
import com.example.phfbackend.service.PurchaseOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
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
    private final InventoryBatchService inventoryBatchService;
    
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
        
        // State Pattern: Lấy state hiện tại và thực hiện transition
        PurchaseOrderState currentState = PurchaseOrderStateFactory.getState(order.getStatus());
        PurchaseOrder updatedOrder = currentState.markOrdered(order, expectedDate);
        return purchaseOrderRepository.save(updatedOrder);
    }
    
    @Override
    public PurchaseOrder markReceived(UUID id) {
        PurchaseOrder order = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Purchase order not found: " + id));
        
        // State Pattern: Lấy state hiện tại và thực hiện transition
        PurchaseOrderState currentState = PurchaseOrderStateFactory.getState(order.getStatus());
        PurchaseOrder updatedOrder = currentState.markReceived(order);
        PurchaseOrder savedOrder = purchaseOrderRepository.save(updatedOrder);
        
        // Tự động tạo inventory batches từ purchase order khi nhận hàng thành công
        if (savedOrder.getStatus() == PurchaseOrderStatus.RECEIVED) {
            createInventoryBatchesFromOrder(savedOrder);
        }
        
        return savedOrder;
    }
    
    /**
     * Tạo inventory batches từ purchase order khi nhận hàng thành công
     * UC37 - Thêm kho hàng từ đơn đặt hàng
     */
    private void createInventoryBatchesFromOrder(PurchaseOrder order) {
        LocalDate receivedDate = LocalDate.now();
        
        for (PurchaseOrderLine line : order.getLineItems()) {
            // Tạo batch number từ order code và line number
            String batchNumber = String.format("%s-L%d", order.getOrderCode(), line.getLineNumber());
            
            // Tính selling price (có thể là cost price + markup, hoặc lấy từ product)
            // Tạm thời sử dụng cost price * 1.2 (20% markup) hoặc lấy từ product nếu có
            BigDecimal sellingPrice = line.getUnitCost().multiply(new BigDecimal("1.2"));
            
            // Tính expiry date (mặc định 2 năm từ ngày nhận, có thể điều chỉnh)
            LocalDate expiryDate = receivedDate.plusYears(2);
            
            // Tạo inventory batch
            InventoryBatch batch = InventoryBatch.newBuilder()
                    .product(line.getProduct())
                    .batchNumber(batchNumber)
                    .quantityOnHand(line.getQuantity())
                    .costPrice(line.getUnitCost())
                    .receivedDate(receivedDate)
                    .expiryDate(expiryDate)
                    .sellingPrice(sellingPrice)
                    .active(true)
                    .build();
            
            inventoryBatchService.createBatch(batch);
        }
    }
    
    @Override
    public PurchaseOrder cancelOrder(UUID id) {
        PurchaseOrder order = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Purchase order not found: " + id));
        
        // State Pattern: Lấy state hiện tại và thực hiện transition
        PurchaseOrderState currentState = PurchaseOrderStateFactory.getState(order.getStatus());
        PurchaseOrder updatedOrder = currentState.cancel(order);
        return purchaseOrderRepository.save(updatedOrder);
    }
    
    @Override
    public PurchaseOrder updateStatus(UUID id, PurchaseOrderStatus status) {
        PurchaseOrder order = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Purchase order not found: " + id));
        
        // Không cho phép thay đổi status từ RECEIVED hoặc CANCELLED
        if (order.getStatus() == PurchaseOrderStatus.RECEIVED || 
            order.getStatus() == PurchaseOrderStatus.CANCELLED) {
            throw new IllegalStateException(
                "Cannot change status from " + order.getStatus() + ". Order is already in final state.");
        }
        
        // Không cho phép chuyển sang DRAFT
        if (status == PurchaseOrderStatus.DRAFT) {
            throw new IllegalStateException("Cannot change status to DRAFT");
        }
        
        // State Pattern: Sử dụng state để xử lý transition
        PurchaseOrderState currentState = PurchaseOrderStateFactory.getState(order.getStatus());
        PurchaseOrderState targetState = PurchaseOrderStateFactory.getState(status);
        
        // Nếu đã ở trạng thái target, không cần làm gì
        if (currentState.getStatus() == targetState.getStatus()) {
            return order;
        }
        
        // Validate transition trước khi thực hiện
        // Không cho phép cancel từ RECEIVED (đã được check ở trên nhưng double check)
        if (status == PurchaseOrderStatus.CANCELLED && 
            order.getStatus() == PurchaseOrderStatus.RECEIVED) {
            throw new IllegalStateException(
                "Cannot cancel a RECEIVED order. Order is already completed.");
        }
        
        // Thực hiện transition dựa trên target state
        PurchaseOrder updatedOrder;
        try {
            switch (status) {
                case ORDERED:
                    updatedOrder = currentState.markOrdered(order, null);
                    break;
                case RECEIVED:
                    updatedOrder = currentState.markReceived(order);
                    break;
                case CANCELLED:
                    updatedOrder = currentState.cancel(order);
                    break;
                case DRAFT:
                    throw new IllegalStateException("Cannot change status to DRAFT");
                default:
                    throw new IllegalArgumentException("Unknown status: " + status);
            }
        } catch (IllegalStateException e) {
            // Re-throw với message rõ ràng hơn
            throw new IllegalStateException(
                "Invalid state transition from " + order.getStatus() + " to " + status + ": " + e.getMessage(), e);
        }
        
        PurchaseOrder savedOrder = purchaseOrderRepository.save(updatedOrder);
        
        // Tự động tạo inventory batches khi chuyển sang RECEIVED
        if (savedOrder.getStatus() == PurchaseOrderStatus.RECEIVED) {
            createInventoryBatchesFromOrder(savedOrder);
        }
        
        return savedOrder;
    }
    
    @Override
    public void deletePurchaseOrder(UUID id) {
        PurchaseOrder order = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Purchase order not found: " + id));
        
        // State Pattern: Kiểm tra xem state hiện tại có cho phép xóa không
        PurchaseOrderState currentState = PurchaseOrderStateFactory.getState(order.getStatus());
        if (!currentState.canDelete()) {
            throw new IllegalStateException("Cannot delete order with status: " + order.getStatus());
        }
        
        purchaseOrderRepository.delete(order);
    }
}



