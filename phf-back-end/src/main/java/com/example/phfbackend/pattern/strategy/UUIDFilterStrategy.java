package com.example.phfbackend.pattern.strategy;

import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Stream;

/**
 * Strategy Pattern - Filter strategy cho UUID fields
 * 
 * @param <T> Type của entity
 */
public class UUIDFilterStrategy<T> implements FilterStrategy<T> {
    
    private final UUID uuidValue;
    private final Function<T, UUID> uuidExtractor;
    
    public UUIDFilterStrategy(UUID uuidValue, Function<T, UUID> uuidExtractor) {
        this.uuidValue = uuidValue;
        this.uuidExtractor = uuidExtractor;
    }
    
    @Override
    public Stream<T> apply(Stream<T> stream) {
        if (!shouldApply()) {
            return stream;
        }
        
        return stream.filter(entity -> {
            UUID entityUuid = uuidExtractor.apply(entity);
            return uuidValue.equals(entityUuid);
        });
    }
    
    @Override
    public boolean shouldApply() {
        return uuidValue != null;
    }
}




