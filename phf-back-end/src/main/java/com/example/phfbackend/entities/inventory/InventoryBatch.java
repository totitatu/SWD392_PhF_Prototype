package com.example.phfbackend.entities.inventory;

import com.example.phfbackend.entities.product.Product;
import com.example.phfbackend.entities.shared.AuditableEntity;
import com.example.phfbackend.entities.shared.Validation;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.NamedQuery;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Represents a batch of stock, enabling FEFO operations and traceability.
 */
@Entity
@Table(name = "inventory_batches")
@NamedQuery(
        name = "InventoryBatch.findExpiringSoon",
        query = "SELECT b FROM InventoryBatch b WHERE b.product.id = :productId AND b.expiryDate <= :thresholdDate ORDER BY b.expiryDate"
)
@Getter
@ToString(callSuper = true, exclude = "product")
@EqualsAndHashCode(callSuper = false, of = "id")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class InventoryBatch extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(name = "batch_number", nullable = false, length = 64)
    private String batchNumber;

    @Column(name = "quantity_on_hand", nullable = false)
    private int quantityOnHand;

    @Column(name = "cost_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal costPrice;

    @Column(name = "received_date", nullable = false)
    private LocalDate receivedDate;

    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;

    @Builder(builderMethodName = "newBuilder")
    private InventoryBatch(UUID id,
                           Product product,
                           String batchNumber,
                           Integer quantityOnHand,
                           BigDecimal costPrice,
                           LocalDate receivedDate,
                           LocalDate expiryDate) {
        this.id = id;
        this.product = Validation.requireNonNull(product, "product");
        this.batchNumber = Validation.requireNonBlank(batchNumber, "batchNumber");
        this.quantityOnHand = Validation.requirePositive(Validation.requireNonNull(quantityOnHand, "quantityOnHand"), "quantityOnHand");
        this.costPrice = Validation.requirePositive(costPrice, "costPrice");
        this.receivedDate = Validation.requireNonNull(receivedDate, "receivedDate");
        this.expiryDate = Validation.requireNonNull(expiryDate, "expiryDate");
        if (this.expiryDate.isBefore(this.receivedDate)) {
            throw new IllegalArgumentException("expiryDate must be on or after receivedDate");
        }
    }

    public void receiveAdditionalQuantity(int quantity) {
        this.quantityOnHand += Validation.requirePositive(quantity, "quantity");
    }

    public void deductQuantity(int quantity) {
        Validation.requirePositive(quantity, "quantity");
        if (this.quantityOnHand < quantity) {
            throw new IllegalArgumentException("quantity exceeds on-hand amount");
        }
        this.quantityOnHand -= quantity;
    }

    public boolean isExpired(LocalDate asOf) {
        return expiryDate.isBefore(asOf);
    }

    public boolean isNearExpiry(LocalDate asOf, int warningDays) {
        Validation.requirePositive(warningDays, "warningDays");
        LocalDate threshold = asOf.plusDays(warningDays);
        return !isExpired(asOf) && (expiryDate.isBefore(threshold) || expiryDate.isEqual(threshold));
    }
}
