package com.example.phfbackend.service;

import com.example.phfbackend.entities.supplier.Supplier;
import com.example.phfbackend.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class SupplierService {
    
    private final SupplierRepository supplierRepository;
    
    public Supplier createSupplier(Supplier supplier) {
        if (supplierRepository.findByName(supplier.getName()).isPresent()) {
            throw new IllegalArgumentException("Supplier with name " + supplier.getName() + " already exists");
        }
        return supplierRepository.save(supplier);
    }
    
    @Transactional(readOnly = true)
    public Optional<Supplier> findById(UUID id) {
        return supplierRepository.findById(id);
    }
    
    @Transactional(readOnly = true)
    public Optional<Supplier> findByName(String name) {
        return supplierRepository.findByName(name);
    }
    
    @Transactional(readOnly = true)
    public List<Supplier> findAll() {
        return supplierRepository.findAll();
    }
    
    @Transactional(readOnly = true)
    public List<Supplier> search(String term) {
        return supplierRepository.searchByNameEmailOrPhone(term);
    }
    
    public Supplier updateSupplier(UUID id, Supplier updatedSupplier) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Supplier not found: " + id));
        supplier.updateName(updatedSupplier.getName());
        supplier.updateContact(updatedSupplier.getContact());
        return supplierRepository.save(supplier);
    }
    
    public void deleteSupplier(UUID id) {
        supplierRepository.deleteById(id);
    }
}


