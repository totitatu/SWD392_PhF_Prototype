package com.example.phfbackend.pattern.strategy;

import java.util.function.Function;
import java.util.stream.Stream;

/**
 * Strategy Pattern - Filter strategy cho enum fields
 * 
 * @param <T> Type của entity
 * @param <E> Type của enum
 */
public class EnumFilterStrategy<T, E extends Enum<E>> implements FilterStrategy<T> {
    
    private final E enumValue;
    private final Function<T, E> enumExtractor;
    
    public EnumFilterStrategy(E enumValue, Function<T, E> enumExtractor) {
        this.enumValue = enumValue;
        this.enumExtractor = enumExtractor;
    }
    
    @Override
    public Stream<T> apply(Stream<T> stream) {
        if (!shouldApply()) {
            return stream;
        }
        
        return stream.filter(entity -> {
            E entityEnum = enumExtractor.apply(entity);
            return enumValue.equals(entityEnum);
        });
    }
    
    @Override
    public boolean shouldApply() {
        return enumValue != null;
    }
}





