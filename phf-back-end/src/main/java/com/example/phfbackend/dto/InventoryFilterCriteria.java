package com.example.phfbackend.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class InventoryFilterCriteria {
    private String searchTerm;
    private UUID productId;
    private Boolean active;
}


