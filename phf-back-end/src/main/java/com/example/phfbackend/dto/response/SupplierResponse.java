package com.example.phfbackend.dto;

import com.example.phfbackend.entities.supplier.ContactInfo;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class SupplierResponse {
    private UUID id;
    private String name;
    private ContactInfo contact;
    private String notes;
    private boolean active;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}


