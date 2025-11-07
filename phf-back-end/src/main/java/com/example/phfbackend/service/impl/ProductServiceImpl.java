package com.example.phfbackend.service.impl;

import com.example.phfbackend.dto.ProductFilterCriteria;
import com.example.phfbackend.entities.product.Product;
import com.example.phfbackend.entities.product.ProductCategory;
import com.example.phfbackend.repository.ProductRepository;
import com.example.phfbackend.service.ProductService;
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
public class ProductServiceImpl implements ProductService {
    
    private final ProductRepository productRepository;
    
    @Override
    public Product createProduct(Product product) {
        if (productRepository.findBySku(product.getSku()).isPresent()) {
            throw new IllegalArgumentException("Product with SKU " + product.getSku() + " already exists");
        }
        return productRepository.save(product);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<Product> findById(UUID id) {
        return productRepository.findById(id);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<Product> findBySku(String sku) {
        return productRepository.findBySku(sku);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Product> findAll() {
        return productRepository.findAll();
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Product> findByCategory(ProductCategory category) {
        return productRepository.findByCategory(category);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Product> search(String term) {
        return productRepository.searchBySkuOrNameOrIngredient(term);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Product> filterProducts(ProductFilterCriteria criteria) {
        Stream<Product> stream = productRepository.findAll().stream();
        
        if (criteria.getSearchTerm() != null && !criteria.getSearchTerm().trim().isEmpty()) {
            String term = criteria.getSearchTerm().trim().toLowerCase();
            stream = stream.filter(product -> 
                product.getSku().toLowerCase().contains(term) || 
                product.getName().toLowerCase().contains(term)
            );
        }
        
        if (criteria.getCategory() != null) {
            stream = stream.filter(product -> product.getCategory() == criteria.getCategory());
        }
        
        if (criteria.getActive() != null) {
            stream = stream.filter(product -> product.isActive() == criteria.getActive());
        }
        
        return stream.toList();
    }
    
    @Override
    public Product updateProduct(UUID id, Product updatedProduct) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found: " + id));
        product.updateDetails(
                updatedProduct.getSku(),
                updatedProduct.getName(),
                updatedProduct.getActiveIngredient(),
                updatedProduct.getDosageForm(),
                updatedProduct.getDosageStrength(),
                updatedProduct.getCategory()
        );
        product.configureAlerts(updatedProduct.getReorderLevel(), updatedProduct.getExpiryAlertDays());
        if (updatedProduct.getDosage() != null) {
            product.updateDosage(updatedProduct.getDosage());
        }
        if (updatedProduct.getMinStock() != null) {
            product.updateMinStock(updatedProduct.getMinStock());
        }
        return productRepository.save(product);
    }
    
    @Override
    public void deactivateProduct(UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found: " + id));
        product.deactivate();
        productRepository.save(product);
    }
    
    @Override
    public void activateProduct(UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found: " + id));
        product.activate();
        productRepository.save(product);
    }
    
    @Override
    public void deleteProduct(UUID id) {
        productRepository.deleteById(id);
    }
}



