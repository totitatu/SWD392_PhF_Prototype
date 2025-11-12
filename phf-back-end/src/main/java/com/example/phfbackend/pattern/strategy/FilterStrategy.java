package com.example.phfbackend.pattern.strategy;

import java.util.stream.Stream;

/**
 * Strategy Pattern - Interface định nghĩa strategy cho filtering
 * Mỗi loại filter sẽ có implementation riêng
 * 
 * @param <T> Type của entity cần filter
 */
public interface FilterStrategy<T> {
    
    /**
     * Áp dụng filter strategy lên stream
     * 
     * @param stream Stream cần filter
     * @return Stream đã được filter
     */
    Stream<T> apply(Stream<T> stream);
    
    /**
     * Kiểm tra xem strategy này có nên được áp dụng không
     * 
     * @return true nếu strategy này nên được áp dụng
     */
    boolean shouldApply();
}




