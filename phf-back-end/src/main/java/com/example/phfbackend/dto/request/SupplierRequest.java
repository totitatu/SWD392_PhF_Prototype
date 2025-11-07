package com.example.phfbackend.dto;

import com.example.phfbackend.entities.supplier.ContactInfo;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SupplierRequest {
    @NotBlank(message = "Name is required")
    private String name;
    
    @NotNull(message = "Contact information is required")
    @Valid
    private ContactInfo contact;
    
    private String notes;
    
    private Boolean active;
}


