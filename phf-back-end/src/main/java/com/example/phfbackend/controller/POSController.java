package com.example.phfbackend.controller;

import com.example.phfbackend.dto.response.POSProductResponse;
import com.example.phfbackend.entities.inventory.InventoryBatch;
import com.example.phfbackend.entities.product.Product;
import com.example.phfbackend.service.InventoryBatchService;
import com.example.phfbackend.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
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
    private final InventoryBatchService inventoryBatchService;
    
    /**
     * UC44 - Tìm kiếm sản phẩm (POS)
     * Nhân viên nhà thuốc tìm kiếm sản phẩm tại điểm bán hàng
     * Search by product name, brand, or ingredient
     * Returns products with name, price, and stock quantity
     */
    @GetMapping("/products/search")
    @Transactional(readOnly = true)
    public ResponseEntity<List<POSProductResponse>> searchProductsForPOS(@RequestParam String term) {
        try {
            List<Product> products = productService.search(term);
            List<POSProductResponse> responses = products.stream()
                    .filter(Product::isActive)
                    .map(this::toPOSResponse)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            // E1: Database query timeout or E2: Inventory data corrupted
            throw new RuntimeException("Search unavailable. Please try again or refresh.", e);
        }
    }
    
    /**
     * Get suggested products for POS (5 products with available stock)
     * Hiển thị 5 sản phẩm gợi ý khi chưa có search term
     */
    @GetMapping("/products/suggested")
    @Transactional(readOnly = true)
    public ResponseEntity<List<POSProductResponse>> getSuggestedProducts() {
        try {
            // Get all active products
            List<Product> allProducts = productService.findAll();
            
            // Filter active products and convert to POS response
            List<POSProductResponse> allResponses = allProducts.stream()
                    .filter(Product::isActive)
                    .map(this::toPOSResponse)
                    .filter(response -> response.getStockQuantity() > 0) // Only products with stock
                    .collect(Collectors.toList());
            
            // Return first 5 products (or all if less than 5)
            List<POSProductResponse> suggested = allResponses.stream()
                    .limit(5)
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(suggested);
        } catch (Exception e) {
            throw new RuntimeException("Failed to load suggested products. Please try again.", e);
        }
    }
    
    /**
     * UC45 - Quét mã vạch
     * Nhân viên nhà thuốc quét mã vạch sản phẩm
     */
    @GetMapping("/products/barcode/{barcode}")
    @Transactional(readOnly = true)
    public ResponseEntity<POSProductResponse> getProductByBarcode(@PathVariable String barcode) {
        return productService.findBySku(barcode)
                .filter(Product::isActive)
                .map(product -> ResponseEntity.ok(toPOSResponse(product)))
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Convert Product to POSProductResponse with inventory information
     * Excludes expired batches from stock calculation (FEFO - First Expired First Out)
     */
    private POSProductResponse toPOSResponse(Product product) {
        UUID productId = product.getId();
        LocalDate currentDate = LocalDate.now();
        
        // Get all active inventory batches for this product
        List<InventoryBatch> batches = inventoryBatchService.findByProductId(productId);
        List<InventoryBatch> availableBatches = batches.stream()
                .filter(InventoryBatch::isActive)
                .filter(b -> b.getQuantityOnHand() > 0)
                .filter(b -> !b.isExpired(currentDate)) // Exclude expired batches
                .collect(Collectors.toList());
        
        // Calculate total stock quantity (excluding expired batches)
        int stockQuantity = availableBatches.stream()
                .mapToInt(InventoryBatch::getQuantityOnHand)
                .sum();
        
        // Get selling price (use the first available batch's price, or 0 if no stock)
        // Sort by expiry date to get the batch with earliest expiry (FEFO)
        BigDecimal sellingPrice = availableBatches.isEmpty() 
                ? BigDecimal.ZERO 
                : availableBatches.stream()
                    .sorted((a, b) -> a.getExpiryDate().compareTo(b.getExpiryDate()))
                    .findFirst()
                    .map(InventoryBatch::getSellingPrice)
                    .orElse(BigDecimal.ZERO);
        
        return POSProductResponse.builder()
                .id(product.getId())
                .sku(product.getSku())
                .name(product.getName())
                .activeIngredient(product.getActiveIngredient())
                .dosageForm(product.getDosageForm())
                .dosageStrength(product.getDosageStrength())
                .dosage(product.getDosage())
                .sellingPrice(sellingPrice)
                .stockQuantity(stockQuantity)
                .available(stockQuantity > 0)
                .build();
    }
}



