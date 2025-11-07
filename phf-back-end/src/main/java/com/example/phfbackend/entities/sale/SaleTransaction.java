package com.example.phfbackend.entities.sale;

import com.example.phfbackend.entities.shared.AuditableEntity;
import com.example.phfbackend.entities.shared.Validation;
import com.example.phfbackend.entities.user.PharmacyUser;
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
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

/**
 * Captures POS transactions and enforces audit requirements for FEFO inventory deduction.
 */
@Entity
@Table(name = "sale_transactions", uniqueConstraints = {
        @UniqueConstraint(name = "uk_sale_receipt", columnNames = "receipt_number")
})
@Getter
@ToString(callSuper = true, exclude = {"cashier", "lineItems"})
@EqualsAndHashCode(callSuper = false, of = "id")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SaleTransaction extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "receipt_number", nullable = false, length = 64)
    private String receiptNumber;

    @Column(name = "sold_at", nullable = false)
    private OffsetDateTime soldAt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cashier_id")
    private PharmacyUser cashier;

    @Column(name = "total_discount", precision = 10, scale = 2)
    private BigDecimal totalDiscount;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", length = 32)
    private PaymentMethod paymentMethod;

    @Column(name = "prescription_image_url", columnDefinition = "TEXT")
    private String prescriptionImageUrl;

    @Column(name = "customer_email", length = 128)
    private String customerEmail;

    @OneToMany(mappedBy = "saleTransaction", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("lineNumber ASC")
    private List<SaleTransactionLine> lineItems = new ArrayList<>();

    @Builder(builderMethodName = "newBuilder")
    private SaleTransaction(UUID id,
                            String receiptNumber,
                            OffsetDateTime soldAt,
                            PharmacyUser cashier,
                            BigDecimal totalDiscount,
                            PaymentMethod paymentMethod,
                            String prescriptionImageUrl,
                            String customerEmail,
                            List<SaleTransactionLine> lineItems) {
        this.id = id;
        this.receiptNumber = Validation.requireNonBlank(receiptNumber, "receiptNumber");
        this.soldAt = Validation.requireNonNull(soldAt, "soldAt");
        this.cashier = Validation.requireNonNull(cashier, "cashier");
        this.totalDiscount = totalDiscount;
        this.paymentMethod = paymentMethod;
        this.prescriptionImageUrl = prescriptionImageUrl;
        this.customerEmail = customerEmail;
        if (lineItems != null) {
            lineItems.forEach(this::addLine);
        }
    }

    public void addLine(SaleTransactionLine line) {
        SaleTransactionLine attached = Validation.requireNonNull(line, "line");
        attached.attachTo(this, lineItems.size() + 1);
        this.lineItems.add(attached);
    }

    public List<SaleTransactionLine> getLineItems() {
        return Collections.unmodifiableList(lineItems);
    }

    public BigDecimal calculateTotalAmount() {
        BigDecimal total = lineItems.stream()
                .map(SaleTransactionLine::calculateLineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (totalDiscount != null) {
            total = total.subtract(totalDiscount);
        }
        return total.max(BigDecimal.ZERO);
    }
}
