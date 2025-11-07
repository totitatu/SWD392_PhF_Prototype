package com.example.phfbackend.service;

import com.example.phfbackend.dto.SupplierFilterCriteria;
import com.example.phfbackend.entities.supplier.Supplier;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SupplierService {
    Supplier createSupplier(Supplier supplier);
    
    Optional<Supplier> findById(UUID id);
    
    Optional<Supplier> findByName(String name);
    
    List<Supplier> findAll();
    
    List<Supplier> search(String term);
    
    List<Supplier> filterSuppliers(SupplierFilterCriteria criteria);
    
    Supplier updateSupplier(UUID id, Supplier updatedSupplier);
    
    void deactivateSupplier(UUID id);
    
    void activateSupplier(UUID id);
    
    void deleteSupplier(UUID id);
}
