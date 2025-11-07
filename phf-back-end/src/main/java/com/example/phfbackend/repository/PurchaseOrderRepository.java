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
    @Query("SELECT DISTINCT po FROM PurchaseOrder po JOIN FETCH po.supplier LEFT JOIN FETCH po.lineItems line LEFT JOIN FETCH line.product WHERE po.orderCode = :orderCode")
    Optional<PurchaseOrder> findByOrderCode(@Param("orderCode") String orderCode);
    
    @Query("SELECT DISTINCT po FROM PurchaseOrder po JOIN FETCH po.supplier LEFT JOIN FETCH po.lineItems line LEFT JOIN FETCH line.product WHERE po.status = :status")
    List<PurchaseOrder> findByStatus(@Param("status") PurchaseOrderStatus status);
    
    @Query("SELECT DISTINCT po FROM PurchaseOrder po JOIN FETCH po.supplier LEFT JOIN FETCH po.lineItems line LEFT JOIN FETCH line.product WHERE po.supplier.id = :supplierId")
    List<PurchaseOrder> findBySupplierId(@Param("supplierId") UUID supplierId);
    
    @Query("SELECT DISTINCT po FROM PurchaseOrder po JOIN FETCH po.supplier LEFT JOIN FETCH po.lineItems line LEFT JOIN FETCH line.product WHERE po.orderDate BETWEEN :startDate AND :endDate")
    List<PurchaseOrder> findByOrderDateBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    @Query("SELECT DISTINCT po FROM PurchaseOrder po JOIN FETCH po.supplier LEFT JOIN FETCH po.lineItems line LEFT JOIN FETCH line.product WHERE po.supplier.name LIKE CONCAT('%', :term, '%') OR po.orderCode LIKE CONCAT('%', :term, '%')")
    List<PurchaseOrder> searchBySupplierNameOrOrderCode(@Param("term") String term);
    
    @Query("SELECT DISTINCT po FROM PurchaseOrder po JOIN FETCH po.supplier LEFT JOIN FETCH po.lineItems line LEFT JOIN FETCH line.product WHERE po.status = :status ORDER BY po.orderDate DESC")
    List<PurchaseOrder> findByStatusOrderByOrderDateDesc(@Param("status") PurchaseOrderStatus status);
    
    @Query("SELECT DISTINCT po FROM PurchaseOrder po JOIN FETCH po.supplier LEFT JOIN FETCH po.lineItems line LEFT JOIN FETCH line.product")
    List<PurchaseOrder> findAllWithRelations();
    
    @Query("SELECT DISTINCT po FROM PurchaseOrder po JOIN FETCH po.supplier LEFT JOIN FETCH po.lineItems line LEFT JOIN FETCH line.product WHERE po.id = :id")
    Optional<PurchaseOrder> findByIdWithRelations(@Param("id") UUID id);
}


