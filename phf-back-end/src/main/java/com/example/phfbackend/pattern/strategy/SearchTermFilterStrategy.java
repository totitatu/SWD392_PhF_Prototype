package com.example.phfbackend.pattern.strategy;

import java.util.function.Function;
import java.util.stream.Stream;

/**
 * Strategy Pattern - Filter strategy cho search term
 * Generic strategy có thể áp dụng cho nhiều loại entity
 * 
 * @param <T> Type của entity
 */
public class SearchTermFilterStrategy<T> implements FilterStrategy<T> {
    
    private final String searchTerm;
    private final Function<T, String> searchFieldExtractor;
    
    public SearchTermFilterStrategy(String searchTerm, Function<T, String> searchFieldExtractor) {
        this.searchTerm = searchTerm;
        this.searchFieldExtractor = searchFieldExtractor;
    }
    
    @Override
    public Stream<T> apply(Stream<T> stream) {
        if (!shouldApply()) {
            return stream;
        }
        
        String term = searchTerm.trim().toLowerCase();
        return stream.filter(entity -> {
            String fieldValue = searchFieldExtractor.apply(entity);
            return fieldValue != null && fieldValue.toLowerCase().contains(term);
        });
    }
    
    @Override
    public boolean shouldApply() {
        return searchTerm != null && !searchTerm.trim().isEmpty();
    }
}




