package com.example.phfbackend.controller;

import com.example.phfbackend.dto.SupplierFilterCriteria;
import com.example.phfbackend.dto.request.SupplierRequest;
import com.example.phfbackend.dto.response.SupplierResponse;
import com.example.phfbackend.entities.supplier.Supplier;
import com.example.phfbackend.repository.SupplierRepository;
import com.example.phfbackend.service.SupplierService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor
public class SupplierController {
    
    private final SupplierService supplierService;
    private final SupplierRepository supplierRepository;
    
    @GetMapping
    public ResponseEntity<List<SupplierResponse>> listSuppliers(
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false) Boolean active) {
        SupplierFilterCriteria criteria = SupplierFilterCriteria.builder()
                .searchTerm(searchTerm)
                .active(active)
                .build();
        
        List<Supplier> suppliers = criteria.getSearchTerm() != null && !criteria.getSearchTerm().trim().isEmpty()
                ? supplierService.search(criteria.getSearchTerm())
                : (criteria.getActive() != null
                        ? supplierService.filterSuppliers(criteria)
                        : supplierService.findAll());
        
        List<SupplierResponse> responses = suppliers.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(responses);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<SupplierResponse> getSupplier(@PathVariable UUID id) {
        return supplierService.findById(id)
                .map(supplier -> ResponseEntity.ok(toResponse(supplier)))
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<SupplierResponse> createSupplier(@Valid @RequestBody SupplierRequest request) {
        Supplier supplier = Supplier.newBuilder()
                .name(request.getName())
                .contact(request.getContact())
                .notes(request.getNotes())
                .active(request.getActive() != null ? request.getActive() : true)
                .build();
        
        Supplier created = supplierService.createSupplier(supplier);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(created));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<SupplierResponse> updateSupplier(@PathVariable UUID id, @Valid @RequestBody SupplierRequest request) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Supplier not found: " + id));
        
        supplier.updateName(request.getName());
        supplier.updateContact(request.getContact());
        if (request.getNotes() != null) {
            supplier.updateNotes(request.getNotes());
        }
        
        // Update active status
        if (request.getActive() != null) {
            if (request.getActive()) {
                supplier.activate();
            } else {
                supplier.deactivate();
            }
        }
        
        Supplier updated = supplierRepository.save(supplier);
        return ResponseEntity.ok(toResponse(updated));
    }
    
    @DeleteMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivateSupplier(@PathVariable UUID id) {
        supplierService.deactivateSupplier(id);
        return ResponseEntity.noContent().build();
    }
    
    @PutMapping("/{id}/activate")
    public ResponseEntity<Void> activateSupplier(@PathVariable UUID id) {
        supplierService.activateSupplier(id);
        return ResponseEntity.noContent().build();
    }
    
    private SupplierResponse toResponse(Supplier supplier) {
        return SupplierResponse.builder()
                .id(supplier.getId())
                .name(supplier.getName())
                .contact(supplier.getContact())
                .notes(supplier.getNotes())
                .active(supplier.isActive())
                .createdAt(supplier.getCreatedAt())
                .updatedAt(supplier.getUpdatedAt())
                .build();
    }
}



