package com.example.phfbackend.entities.shared;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * System activity log for audit and monitoring purposes.
 */
@Entity
@Table(name = "system_logs")
@Getter
@ToString
@EqualsAndHashCode(of = "id")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SystemLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 64)
    private String action;

    @Column(name = "entity_type", length = 64)
    private String entityType;

    @Column(name = "entity_id")
    private UUID entityId;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "user_name", length = 128)
    private String userName;

    @Column(length = 1000)
    private String details;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Builder(builderMethodName = "newBuilder")
    private SystemLog(UUID id,
                      String action,
                      String entityType,
                      UUID entityId,
                      UUID userId,
                      String userName,
                      String details,
                      OffsetDateTime createdAt) {
        this.id = id;
        this.action = action;
        this.entityType = entityType;
        this.entityId = entityId;
        this.userId = userId;
        this.userName = userName;
        this.details = details;
        this.createdAt = createdAt != null ? createdAt : OffsetDateTime.now();
    }
}


