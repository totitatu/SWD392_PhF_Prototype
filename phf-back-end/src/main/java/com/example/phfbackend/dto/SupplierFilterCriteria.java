package com.example.phfbackend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SupplierFilterCriteria {
    private String searchTerm;
    private Boolean active;
}


