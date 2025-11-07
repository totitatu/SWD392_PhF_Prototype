package com.example.phfbackend.controller;

import com.example.phfbackend.dto.ProductResponse;
import com.example.phfbackend.entities.product.Product;
import com.example.phfbackend.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * POS (Point of Sale) specific endpoints
 * UC43 - Xem điểm bán hàng (POS)
 * UC44 - Tìm kiếm sản phẩm (POS)
 * UC45 - Quét mã vạch
 */
@RestController
@RequestMapping("/api/pos")
@RequiredArgsConstructor
public class POSController {
    
    private final ProductService productService;
    
    /**
     * UC44 - Tìm kiếm sản phẩm (POS)
     * Nhân viên nhà thuốc tìm kiếm sản phẩm tại điểm bán hàng
     */
    @GetMapping("/products/search")
    public ResponseEntity<List<ProductResponse>> searchProductsForPOS(@RequestParam String term) {
        List<Product> products = productService.search(term);
        List<ProductResponse> responses = products.stream()
                .filter(Product::isActive)
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }
    
    /**
     * UC45 - Quét mã vạch
     * Nhân viên nhà thuốc quét mã vạch sản phẩm
     */
    @GetMapping("/products/barcode/{barcode}")
    public ResponseEntity<ProductResponse> getProductByBarcode(@PathVariable String barcode) {
        return productService.findBySku(barcode)
                .filter(Product::isActive)
                .map(product -> ResponseEntity.ok(toResponse(product)))
                .orElse(ResponseEntity.notFound().build());
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


