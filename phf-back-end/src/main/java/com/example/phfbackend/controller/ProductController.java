package com.example.phfbackend.controller;

import com.example.phfbackend.dto.request.GeminiRequest;
import com.example.phfbackend.dto.GeminiResponse;
import com.example.phfbackend.dto.ProductFilterCriteria;
import com.example.phfbackend.dto.request.ProductRequest;
import com.example.phfbackend.dto.response.ProductResponse;
import com.example.phfbackend.entities.product.Product;
import com.example.phfbackend.repository.ProductRepository;
import com.example.phfbackend.service.GeminiService;
import com.example.phfbackend.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {
    
    private final ProductService productService;
    private final GeminiService geminiService;
    private final ProductRepository productRepository;
    
    @GetMapping
    public ResponseEntity<List<ProductResponse>> listProducts(
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Boolean active) {
        ProductFilterCriteria criteria = ProductFilterCriteria.builder()
                .searchTerm(searchTerm)
                .category(category != null ? com.example.phfbackend.entities.product.ProductCategory.valueOf(category) : null)
                .active(active)
                .build();
        
        List<Product> products = criteria.getSearchTerm() != null && !criteria.getSearchTerm().trim().isEmpty()
                ? productService.search(criteria.getSearchTerm())
                : (criteria.getCategory() != null || criteria.getActive() != null
                        ? productService.filterProducts(criteria)
                        : productService.findAll());
        
        List<ProductResponse> responses = products.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(responses);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getProduct(@PathVariable UUID id) {
        return productService.findById(id)
                .map(product -> ResponseEntity.ok(toResponse(product)))
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<ProductResponse> createProduct(@Valid @RequestBody ProductRequest request) {
        Product product = Product.newBuilder()
                .sku(request.getSku())
                .name(request.getName())
                .activeIngredient(request.getActiveIngredient())
                .dosageForm(request.getDosageForm())
                .dosageStrength(request.getDosageStrength())
                .category(request.getCategory())
                .reorderLevel(request.getReorderLevel())
                .expiryAlertDays(request.getExpiryAlertDays())
                .dosage(request.getDosage())
                .minStock(request.getMinStock())
                .active(request.getActive() != null ? request.getActive() : true)
                .build();
        
        Product created = productService.createProduct(product);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(created));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<ProductResponse> updateProduct(@PathVariable UUID id, @Valid @RequestBody ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found: " + id));
        
        // Update product details
        product.updateDetails(
                request.getSku(),
                request.getName(),
                request.getActiveIngredient(),
                request.getDosageForm(),
                request.getDosageStrength(),
                request.getCategory()
        );
        
        // Update alerts configuration
        product.configureAlerts(request.getReorderLevel(), request.getExpiryAlertDays());
        
        // Update optional fields
        if (request.getDosage() != null) {
            product.updateDosage(request.getDosage());
        }
        if (request.getMinStock() != null) {
            product.updateMinStock(request.getMinStock());
        }
        
        // Update active status
        if (request.getActive() != null) {
            if (request.getActive()) {
                product.activate();
            } else {
                product.deactivate();
            }
        }
        
        Product updated = productRepository.save(product);
        return ResponseEntity.ok(toResponse(updated));
    }
    
    @DeleteMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivateProduct(@PathVariable UUID id) {
        productService.deactivateProduct(id);
        return ResponseEntity.noContent().build();
    }
    
    @PutMapping("/{id}/activate")
    public ResponseEntity<Void> activateProduct(@PathVariable UUID id) {
        productService.activateProduct(id);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * UC25 - Chỉnh sửa sản phẩm với Gemini
     * Chủ nhà thuốc chỉnh sửa thông tin sản phẩm hiện có với sự hỗ trợ của Gemini
     */
    @PostMapping("/{id}/edit-with-gemini")
    public ResponseEntity<GeminiResponse> editProductWithGemini(
            @PathVariable UUID id,
            @Valid @RequestBody GeminiRequest request) {
        try {
            // Get product info for context
            Product product = productService.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Product not found: " + id));
            
            String context = String.format(
                "Sản phẩm hiện tại: Tên: %s, SKU: %s, Hoạt chất: %s, Dạng bào chế: %s, Độ mạnh: %s",
                product.getName(), product.getSku(), product.getActiveIngredient(),
                product.getDosageForm(), product.getDosageStrength()
            );
            
            String fullInput = context + ". " + request.getUserInput();
            String suggestion = geminiService.suggestProductEdit(id, fullInput);
            
            GeminiResponse response = GeminiResponse.builder()
                    .suggestion(suggestion)
                    .success(true)
                    .build();
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            GeminiResponse errorResponse = GeminiResponse.builder()
                    .success(false)
                    .errorMessage(e.getMessage())
                    .build();
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    
    private ProductResponse toResponse(Product product) {
        return ProductResponse.builder()
                .id(product.getId())
                .sku(product.getSku())
                .name(product.getName())
                .activeIngredient(product.getActiveIngredient())
                .dosageForm(product.getDosageForm())
                .dosageStrength(product.getDosageStrength())
                .category(product.getCategory())
                .reorderLevel(product.getReorderLevel())
                .expiryAlertDays(product.getExpiryAlertDays())
                .dosage(product.getDosage())
                .minStock(product.getMinStock())
                .active(product.isActive())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }
}

