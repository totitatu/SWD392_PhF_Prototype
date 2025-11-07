package com.example.phfbackend.dto;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class SaleTransactionFilterCriteria {
    private String searchTerm;
    private UUID cashierId;
    private OffsetDateTime startDate;
    private OffsetDateTime endDate;
}



