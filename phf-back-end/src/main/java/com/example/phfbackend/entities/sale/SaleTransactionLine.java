package com.example.phfbackend.entities.sale;

import com.example.phfbackend.entities.inventory.InventoryBatch;
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
 * Detailed item sold within a POS transaction.
 * Keeps a pointer to the FEFO batch used for traceability.
 */
@Entity
@Table(name = "sale_transaction_lines")
@Getter
@ToString(exclude = {"saleTransaction", "product", "inventoryBatch"})
@EqualsAndHashCode(of = "id")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SaleTransactionLine {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sale_transaction_id")
    private SaleTransaction saleTransaction;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id")
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventory_batch_id")
    private InventoryBatch inventoryBatch;

    @Column(name = "line_number", nullable = false)
    private int lineNumber;

    @Column(name = "quantity", nullable = false)
    private int quantity;

    @Column(name = "unit_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Builder(builderMethodName = "newBuilder")
    private SaleTransactionLine(UUID id,
                                Product product,
                                InventoryBatch inventoryBatch,
                                Integer quantity,
                                BigDecimal unitPrice) {
        this.id = id;
        this.product = Validation.requireNonNull(product, "product");
        this.inventoryBatch = inventoryBatch;
        this.quantity = Validation.requirePositive(Validation.requireNonNull(quantity, "quantity"), "quantity");
        this.unitPrice = Validation.requirePositive(unitPrice, "unitPrice");
    }

    void attachTo(SaleTransaction transaction, int lineNumber) {
        this.saleTransaction = Validation.requireNonNull(transaction, "saleTransaction");
        this.lineNumber = lineNumber;
    }

    public BigDecimal calculateLineTotal() {
        return unitPrice.multiply(BigDecimal.valueOf(quantity));
    }
}
