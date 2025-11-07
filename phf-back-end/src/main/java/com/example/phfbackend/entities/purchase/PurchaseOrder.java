package com.example.phfbackend.entities.purchase;

import com.example.phfbackend.entities.shared.AuditableEntity;
import com.example.phfbackend.entities.shared.Validation;
import com.example.phfbackend.entities.supplier.Supplier;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

/**
 * Aggregates line items and status for supplier purchase orders.
 */
@Entity
@Table(name = "purchase_orders")
@Getter
@ToString(callSuper = true, exclude = {"supplier", "lineItems"})
@EqualsAndHashCode(callSuper = false, of = "id")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PurchaseOrder extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "order_code", nullable = false, length = 64, unique = true)
    private String orderCode;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "supplier_id")
    private Supplier supplier;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private PurchaseOrderStatus status;

    @Column(name = "order_date", nullable = false)
    private LocalDate orderDate;

    @Column(name = "expected_date")
    private LocalDate expectedDate;

    @OneToMany(mappedBy = "purchaseOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("lineNumber ASC")
    private List<PurchaseOrderLine> lineItems = new ArrayList<>();

    @Builder(builderMethodName = "newBuilder")
    private PurchaseOrder(UUID id,
                          String orderCode,
                          Supplier supplier,
                          PurchaseOrderStatus status,
                          LocalDate orderDate,
                          LocalDate expectedDate,
                          List<PurchaseOrderLine> lineItems) {
        this.id = id;
        this.orderCode = Validation.requireNonBlank(orderCode, "orderCode");
        this.supplier = Validation.requireNonNull(supplier, "supplier");
        this.status = status != null ? status : PurchaseOrderStatus.DRAFT;
        this.orderDate = Validation.requireNonNull(orderDate, "orderDate");
        this.expectedDate = expectedDate;
        if (lineItems != null) {
            lineItems.forEach(this::addLine);
        }
    }

    public void addLine(PurchaseOrderLine line) {
        PurchaseOrderLine attached = Validation.requireNonNull(line, "line");
        attached.attachTo(this, lineItems.size() + 1);
        this.lineItems.add(attached);
    }

    public void removeLine(PurchaseOrderLine line) {
        this.lineItems.remove(line);
    }

    public List<PurchaseOrderLine> getLineItems() {
        return Collections.unmodifiableList(lineItems);
    }

    public void markOrdered(LocalDate expectedDate) {
        this.status = PurchaseOrderStatus.ORDERED;
        this.expectedDate = expectedDate;
    }

    public void markReceived() {
        this.status = PurchaseOrderStatus.RECEIVED;
    }

    public void cancel() {
        this.status = PurchaseOrderStatus.CANCELLED;
    }
}
