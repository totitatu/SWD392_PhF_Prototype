package com.example.phfbackend.repository;

import com.example.phfbackend.entities.supplier.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, UUID> {
    Optional<Supplier> findByName(String name);
    
    @Query("SELECT s FROM Supplier s WHERE s.name LIKE %:term% OR s.contact.email LIKE %:term% OR s.contact.phone LIKE %:term%")
    List<Supplier> searchByNameEmailOrPhone(@Param("term") String term);
}

