package com.example.phfbackend.entities.product;

import com.example.phfbackend.entities.shared.AuditableEntity;
import com.example.phfbackend.entities.shared.Validation;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.UUID;

/**
 * Master data for pharmaceutical products.
 * Enforces category-specific configuration for downstream inventory, sales, and purchasing workflows.
 */
@Entity
@Table(name = "products", uniqueConstraints = {
        @UniqueConstraint(name = "uk_product_sku", columnNames = "sku")
})
@Getter
@ToString(callSuper = true)
@EqualsAndHashCode(callSuper = false, of = "id")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Product extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 64)
    private String sku;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(name = "active_ingredient", nullable = false, length = 255)
    private String activeIngredient;

    @Column(name = "dosage_form", nullable = false, length = 128)
    private String dosageForm;

    @Column(name = "dosage_strength", nullable = false, length = 64)
    private String dosageStrength;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ProductCategory category;

    @Column(name = "reorder_level")
    private Integer reorderLevel;

    @Column(name = "expiry_alert_days")
    private Integer expiryAlertDays;

    @Builder(builderMethodName = "newBuilder")
    private Product(UUID id,
                    String sku,
                    String name,
                    String activeIngredient,
                    String dosageForm,
                    String dosageStrength,
                    ProductCategory category,
                    Integer reorderLevel,
                    Integer expiryAlertDays) {
        this.id = id;
        updateDetails(sku, name, activeIngredient, dosageForm, dosageStrength, category);
        configureAlerts(reorderLevel, expiryAlertDays);
    }

    public void updateDetails(String sku,
                              String name,
                              String activeIngredient,
                              String dosageForm,
                              String dosageStrength,
                              ProductCategory category) {
        this.sku = Validation.requireNonBlank(sku, "sku");
        this.name = Validation.requireNonBlank(name, "name");
        this.activeIngredient = Validation.requireNonBlank(activeIngredient, "activeIngredient");
        this.dosageForm = Validation.requireNonBlank(dosageForm, "dosageForm");
        this.dosageStrength = Validation.requireNonBlank(dosageStrength, "dosageStrength");
        this.category = Validation.requireNonNull(category, "category");
    }

    public void configureAlerts(Integer reorderLevel, Integer expiryAlertDays) {
        this.reorderLevel = reorderLevel != null ? Validation.requirePositiveOrZero(reorderLevel, "reorderLevel") : null;
        this.expiryAlertDays = expiryAlertDays != null ? Validation.requirePositiveOrZero(expiryAlertDays, "expiryAlertDays") : null;
    }
}
