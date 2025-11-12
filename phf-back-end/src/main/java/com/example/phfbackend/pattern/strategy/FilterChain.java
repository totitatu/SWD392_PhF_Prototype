package com.example.phfbackend.pattern.strategy;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

/**
 * Strategy Pattern - Chain of strategies để áp dụng nhiều filters
 * Sử dụng Chain of Responsibility pattern kết hợp với Strategy pattern
 * 
 * @param <T> Type của entity
 */
public class FilterChain<T> {
    
    private final List<FilterStrategy<T>> strategies = new ArrayList<>();
    
    /**
     * Thêm strategy vào chain
     */
    public FilterChain<T> addStrategy(FilterStrategy<T> strategy) {
        if (strategy != null && strategy.shouldApply()) {
            strategies.add(strategy);
        }
        return this;
    }
    
    /**
     * Áp dụng tất cả strategies lên stream
     */
    public Stream<T> apply(Stream<T> stream) {
        Stream<T> result = stream;
        for (FilterStrategy<T> strategy : strategies) {
            result = strategy.apply(result);
        }
        return result;
    }
    
    /**
     * Áp dụng và convert sang List
     */
    public List<T> applyToList(Stream<T> stream) {
        return apply(stream).toList();
    }
}




