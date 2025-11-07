package com.example.phfbackend.service;

import com.example.phfbackend.dto.ProductFilterCriteria;
import com.example.phfbackend.entities.product.Product;
import com.example.phfbackend.entities.product.ProductCategory;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductService {
    Product createProduct(Product product);
    
    Optional<Product> findById(UUID id);
    
    Optional<Product> findBySku(String sku);
    
    List<Product> findAll();
    
    List<Product> findByCategory(ProductCategory category);
    
    List<Product> search(String term);
    
    List<Product> filterProducts(ProductFilterCriteria criteria);
    
    Product updateProduct(UUID id, Product updatedProduct);
    
    void deactivateProduct(UUID id);
    
    void activateProduct(UUID id);
    
    void deleteProduct(UUID id);
}
