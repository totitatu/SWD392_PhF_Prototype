package com.example.phfbackend.repository;

import com.example.phfbackend.entities.product.Product;
import com.example.phfbackend.entities.product.ProductCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID> {
    Optional<Product> findBySku(String sku);
    
    List<Product> findByCategory(ProductCategory category);
    
    List<Product> findByNameContainingIgnoreCase(String name);
    
    @Query("SELECT p FROM Product p WHERE p.sku LIKE %:term% OR p.name LIKE %:term%")
    List<Product> searchBySkuOrName(@Param("term") String term);
    
    List<Product> findByActiveTrue();
}


