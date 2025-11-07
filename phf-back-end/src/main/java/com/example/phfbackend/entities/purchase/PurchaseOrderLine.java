package com.example.phfbackend.entities.purchase;

import com.example.phfbackend.entities.product.Product;
import com.example.phfbackend.entities.shared.Validation;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Individual item in a purchase order to be emailed to suppliers.
 */
@Entity
@Table(name = "purchase_order_lines")
@Getter
@ToString(exclude = {"purchaseOrder", "product"})
@EqualsAndHashCode(of = "id")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PurchaseOrderLine {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "purchase_order_id")
    private PurchaseOrder purchaseOrder;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(name = "line_number", nullable = false)
    private int lineNumber;

    @Column(nullable = false)
    private int quantity;

    @Column(name = "unit_cost", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitCost;

    @Builder(builderMethodName = "newBuilder")
    private PurchaseOrderLine(UUID id,
                              Product product,
                              Integer quantity,
                              BigDecimal unitCost) {
        this.id = id;
        this.product = Validation.requireNonNull(product, "product");
        this.quantity = Validation.requirePositive(Validation.requireNonNull(quantity, "quantity"), "quantity");
        this.unitCost = Validation.requirePositive(unitCost, "unitCost");
    }

    void attachTo(PurchaseOrder purchaseOrder, int lineNumber) {
        this.purchaseOrder = Validation.requireNonNull(purchaseOrder, "purchaseOrder");
        this.lineNumber = lineNumber;
    }
}
