package com.example.phfbackend.entities.user;

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
 * Accounts used by pharmacy staff and owners with role-based access control.
 */
@Entity
@Table(name = "pharmacy_users", uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_email", columnNames = "email")
})
@Getter
@ToString(callSuper = true)
@EqualsAndHashCode(callSuper = false, of = "id")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PharmacyUser extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 128)
    private String fullName;

    @Column(nullable = false, length = 128)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private UserRole role;

    @Column(nullable = false)
    private boolean active;

    @Builder(builderMethodName = "newBuilder")
    private PharmacyUser(UUID id,
                         String fullName,
                         String email,
                         String passwordHash,
                         UserRole role,
                         Boolean active) {
        this.id = id;
        updateProfile(fullName, email);
        updateRole(role);
        updatePassword(passwordHash);
        this.active = active != null ? active : true;
    }

    public void updateProfile(String fullName, String email) {
        this.fullName = Validation.requireNonBlank(fullName, "fullName");
        this.email = Validation.requireNonBlank(email, "email");
    }

    public void updatePassword(String passwordHash) {
        this.passwordHash = Validation.requireNonBlank(passwordHash, "passwordHash");
    }

    public void updateRole(UserRole role) {
        this.role = Validation.requireNonNull(role, "role");
    }

    public void deactivate() {
        this.active = false;
    }

    public void activate() {
        this.active = true;
    }
}
