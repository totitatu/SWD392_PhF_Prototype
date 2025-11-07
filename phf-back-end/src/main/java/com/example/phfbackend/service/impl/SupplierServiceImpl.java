package com.example.phfbackend.service.impl;

import com.example.phfbackend.dto.SupplierFilterCriteria;
import com.example.phfbackend.entities.supplier.Supplier;
import com.example.phfbackend.repository.SupplierRepository;
import com.example.phfbackend.service.SupplierService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Transactional
public class SupplierServiceImpl implements SupplierService {
    
    private final SupplierRepository supplierRepository;
    
    @Override
    public Supplier createSupplier(Supplier supplier) {
        if (supplierRepository.findByName(supplier.getName()).isPresent()) {
            throw new IllegalArgumentException("Supplier with name " + supplier.getName() + " already exists");
        }
        return supplierRepository.save(supplier);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<Supplier> findById(UUID id) {
        return supplierRepository.findById(id);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<Supplier> findByName(String name) {
        return supplierRepository.findByName(name);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Supplier> findAll() {
        return supplierRepository.findAll();
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Supplier> search(String term) {
        return supplierRepository.searchByNameEmailOrPhone(term);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Supplier> filterSuppliers(SupplierFilterCriteria criteria) {
        Stream<Supplier> stream = supplierRepository.findAll().stream();
        
        if (criteria.getSearchTerm() != null && !criteria.getSearchTerm().trim().isEmpty()) {
            String term = criteria.getSearchTerm().trim().toLowerCase();
            stream = stream.filter(supplier -> 
                supplier.getName().toLowerCase().contains(term) ||
                supplier.getContact().getEmail().toLowerCase().contains(term) ||
                (supplier.getContact().getPhone() != null && supplier.getContact().getPhone().toLowerCase().contains(term))
            );
        }
        
        if (criteria.getActive() != null) {
            stream = stream.filter(supplier -> supplier.isActive() == criteria.getActive());
        }
        
        return stream.toList();
    }
    
    @Override
    public Supplier updateSupplier(UUID id, Supplier updatedSupplier) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Supplier not found: " + id));
        supplier.updateName(updatedSupplier.getName());
        supplier.updateContact(updatedSupplier.getContact());
        if (updatedSupplier.getNotes() != null) {
            supplier.updateNotes(updatedSupplier.getNotes());
        }
        // Update active status
        if (updatedSupplier.isActive() != supplier.isActive()) {
            if (updatedSupplier.isActive()) {
                supplier.activate();
            } else {
                supplier.deactivate();
            }
        }
        return supplierRepository.save(supplier);
    }
    
    @Override
    public void deactivateSupplier(UUID id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Supplier not found: " + id));
        supplier.deactivate();
        supplierRepository.save(supplier);
    }
    
    @Override
    public void activateSupplier(UUID id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Supplier not found: " + id));
        supplier.activate();
        supplierRepository.save(supplier);
    }
    
    @Override
    public void deleteSupplier(UUID id) {
        supplierRepository.deleteById(id);
    }
}



