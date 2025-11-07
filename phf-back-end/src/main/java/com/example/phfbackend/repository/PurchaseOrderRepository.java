package com.example.phfbackend.repository;

import com.example.phfbackend.entities.purchase.PurchaseOrder;
import com.example.phfbackend.entities.purchase.PurchaseOrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, UUID> {
    Optional<PurchaseOrder> findByOrderCode(String orderCode);
    
    List<PurchaseOrder> findByStatus(PurchaseOrderStatus status);
    
    List<PurchaseOrder> findBySupplierId(UUID supplierId);
    
    @Query("SELECT po FROM PurchaseOrder po WHERE po.orderDate BETWEEN :startDate AND :endDate")
    List<PurchaseOrder> findByOrderDateBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    @Query("SELECT po FROM PurchaseOrder po WHERE po.supplier.name LIKE %:term% OR po.orderCode LIKE %:term%")
    List<PurchaseOrder> searchBySupplierNameOrOrderCode(@Param("term") String term);
    
    List<PurchaseOrder> findByStatusOrderByOrderDateDesc(PurchaseOrderStatus status);
}


