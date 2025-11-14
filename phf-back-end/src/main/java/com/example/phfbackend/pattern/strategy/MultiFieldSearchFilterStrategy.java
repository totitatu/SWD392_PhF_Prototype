package com.example.phfbackend.pattern.strategy;

import java.util.List;
import java.util.function.Function;
import java.util.stream.Stream;

/**
 * Strategy Pattern - Filter strategy cho multi-field search
 * Tìm kiếm trong nhiều fields cùng lúc
 * 
 * @param <T> Type của entity
 */
public class MultiFieldSearchFilterStrategy<T> implements FilterStrategy<T> {
    
    private final String searchTerm;
    private final List<Function<T, String>> fieldExtractors;
    
    public MultiFieldSearchFilterStrategy(String searchTerm, List<Function<T, String>> fieldExtractors) {
        this.searchTerm = searchTerm;
        this.fieldExtractors = fieldExtractors;
    }
    
    @Override
    public Stream<T> apply(Stream<T> stream) {
        if (!shouldApply()) {
            return stream;
        }
        
        String term = searchTerm.trim().toLowerCase();
        return stream.filter(entity -> {
            return fieldExtractors.stream()
                    .anyMatch(extractor -> {
                        String fieldValue = extractor.apply(entity);
                        return fieldValue != null && fieldValue.toLowerCase().contains(term);
                    });
        });
    }
    
    @Override
    public boolean shouldApply() {
        return searchTerm != null && !searchTerm.trim().isEmpty() && !fieldExtractors.isEmpty();
    }
}





