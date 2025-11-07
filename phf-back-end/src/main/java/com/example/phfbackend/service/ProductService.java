package com.example.phfbackend.service;

import com.example.phfbackend.entities.product.Product;
import com.example.phfbackend.entities.product.ProductCategory;
import com.example.phfbackend.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ProductService {
    
    private final ProductRepository productRepository;
    
    public Product createProduct(Product product) {
        if (productRepository.findBySku(product.getSku()).isPresent()) {
            throw new IllegalArgumentException("Product with SKU " + product.getSku() + " already exists");
        }
        return productRepository.save(product);
    }
    
    @Transactional(readOnly = true)
    public Optional<Product> findById(UUID id) {
        return productRepository.findById(id);
    }
    
    @Transactional(readOnly = true)
    public Optional<Product> findBySku(String sku) {
        return productRepository.findBySku(sku);
    }
    
    @Transactional(readOnly = true)
    public List<Product> findAll() {
        return productRepository.findAll();
    }
    
    @Transactional(readOnly = true)
    public List<Product> findByCategory(ProductCategory category) {
        return productRepository.findByCategory(category);
    }
    
    @Transactional(readOnly = true)
    public List<Product> search(String term) {
        return productRepository.searchBySkuOrName(term);
    }
    
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
        return productRepository.save(product);
    }
    
    public void deleteProduct(UUID id) {
        productRepository.deleteById(id);
    }
}


