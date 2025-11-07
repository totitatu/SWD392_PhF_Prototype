package com.example.phfbackend.dto;

import com.example.phfbackend.entities.product.ProductCategory;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProductFilterCriteria {
    private String searchTerm;
    private ProductCategory category;
    private Boolean active;
}


