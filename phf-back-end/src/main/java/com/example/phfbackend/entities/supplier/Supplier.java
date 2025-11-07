package com.example.phfbackend.entities.supplier;

import com.example.phfbackend.entities.product.Product;
import com.example.phfbackend.entities.shared.AuditableEntity;
import com.example.phfbackend.entities.shared.Validation;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Singular;
import lombok.ToString;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * Supplier master data used for procurement workflows.
 */
@Entity
@Table(name = "suppliers", uniqueConstraints = {
        @UniqueConstraint(name = "uk_supplier_name", columnNames = "name")
})
@Getter
@ToString(callSuper = true, exclude = "products")
@EqualsAndHashCode(callSuper = false, of = "id")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Supplier extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 255)
    private String name;

    @Embedded
    private ContactInfo contact;

    @ManyToMany(fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
            name = "supplier_products",
            joinColumns = @JoinColumn(name = "supplier_id"),
            inverseJoinColumns = @JoinColumn(name = "product_id")
    )
    private Set<Product> products = new HashSet<>();

    @Column(length = 1000)
    private String notes;

    @Column(nullable = false)
    private boolean active;

    @Builder(builderMethodName = "newBuilder")
    private Supplier(UUID id,
                     String name,
                     ContactInfo contact,
                     @Singular Set<Product> products,
                     String notes,
                     Boolean active) {
        this.id = id;
        updateName(name);
        updateContact(contact);
        this.notes = notes;
        this.active = active != null ? active : true;
        if (products != null) {
            this.products.addAll(products);
        }
    }

    public void updateName(String name) {
        this.name = Validation.requireNonBlank(name, "name");
    }

    public void updateContact(ContactInfo contact) {
        this.contact = Validation.requireNonNull(contact, "contact");
    }

    public Set<Product> getProducts() {
        return Collections.unmodifiableSet(products);
    }

    public void registerProduct(Product product) {
        products.add(Validation.requireNonNull(product, "product"));
    }

    public void unregisterProduct(Product product) {
        products.remove(Validation.requireNonNull(product, "product"));
    }

    public void updateNotes(String notes) {
        this.notes = notes;
    }

    public void deactivate() {
        this.active = false;
    }

    public void activate() {
        this.active = true;
    }
}
