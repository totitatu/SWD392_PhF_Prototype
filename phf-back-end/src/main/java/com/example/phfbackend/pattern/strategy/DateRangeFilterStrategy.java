package com.example.phfbackend.pattern.strategy;

import java.time.LocalDate;
import java.util.function.Function;
import java.util.stream.Stream;

/**
 * Strategy Pattern - Filter strategy cho date range
 * 
 * @param <T> Type của entity
 */
public class DateRangeFilterStrategy<T> implements FilterStrategy<T> {
    
    private final LocalDate startDate;
    private final LocalDate endDate;
    private final Function<T, LocalDate> dateExtractor;
    
    public DateRangeFilterStrategy(LocalDate startDate, LocalDate endDate, Function<T, LocalDate> dateExtractor) {
        this.startDate = startDate;
        this.endDate = endDate;
        this.dateExtractor = dateExtractor;
    }
    
    @Override
    public Stream<T> apply(Stream<T> stream) {
        if (!shouldApply()) {
            return stream;
        }
        
        return stream.filter(entity -> {
            LocalDate entityDate = dateExtractor.apply(entity);
            if (entityDate == null) {
                return false;
            }
            
            boolean afterStart = startDate == null || !entityDate.isBefore(startDate);
            boolean beforeEnd = endDate == null || !entityDate.isAfter(endDate);
            
            return afterStart && beforeEnd;
        });
    }
    
    @Override
    public boolean shouldApply() {
        return startDate != null || endDate != null;
    }
}




