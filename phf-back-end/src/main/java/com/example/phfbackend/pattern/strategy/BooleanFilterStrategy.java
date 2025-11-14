package com.example.phfbackend.pattern.strategy;

import java.util.function.Function;
import java.util.stream.Stream;

/**
 * Strategy Pattern - Filter strategy cho boolean fields
 * 
 * @param <T> Type của entity
 */
public class BooleanFilterStrategy<T> implements FilterStrategy<T> {
    
    private final Boolean booleanValue;
    private final Function<T, Boolean> booleanExtractor;
    
    public BooleanFilterStrategy(Boolean booleanValue, Function<T, Boolean> booleanExtractor) {
        this.booleanValue = booleanValue;
        this.booleanExtractor = booleanExtractor;
    }
    
    @Override
    public Stream<T> apply(Stream<T> stream) {
        if (!shouldApply()) {
            return stream;
        }
        
        return stream.filter(entity -> {
            Boolean entityBoolean = booleanExtractor.apply(entity);
            return booleanValue.equals(entityBoolean);
        });
    }
    
    @Override
    public boolean shouldApply() {
        return booleanValue != null;
    }
}





