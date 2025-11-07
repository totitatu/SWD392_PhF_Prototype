package com.example.phfbackend.entities.inventory;

import com.example.phfbackend.entities.product.Product;
import com.example.phfbackend.entities.shared.AuditableEntity;
import com.example.phfbackend.entities.shared.Validation;
import com.example.phfbackend.entities.user.PharmacyUser;
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
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.UUID;

/**
 * Records manual interventions applied to inventory counts for auditability.
 */
@Entity
@Table(name = "inventory_adjustments")
@Getter
@ToString(callSuper = true, exclude = {"product", "performedBy"})
@EqualsAndHashCode(callSuper = false, of = "id")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class InventoryAdjustment extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id")
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "performed_by")
    private PharmacyUser performedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private InventoryAdjustmentType type;

    @Column(nullable = false)
    private int quantityChange;

    @Column(length = 255)
    private String reason;

    @Builder(builderMethodName = "newBuilder")
    private InventoryAdjustment(UUID id,
                                Product product,
                                PharmacyUser performedBy,
                                InventoryAdjustmentType type,
                                Integer quantityChange,
                                String reason) {
        this.id = id;
        this.product = Validation.requireNonNull(product, "product");
        this.performedBy = Validation.requireNonNull(performedBy, "performedBy");
        this.type = Validation.requireNonNull(type, "type");
        this.quantityChange = Validation.requireNonNull(quantityChange, "quantityChange");
        if (this.quantityChange == 0) {
            throw new IllegalArgumentException("quantityChange cannot be zero");
        }
        this.reason = reason;
    }
}
