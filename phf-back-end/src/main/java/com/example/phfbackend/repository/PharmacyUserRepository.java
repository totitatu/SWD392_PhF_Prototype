package com.example.phfbackend.repository;

import com.example.phfbackend.entities.user.PharmacyUser;
import com.example.phfbackend.entities.user.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PharmacyUserRepository extends JpaRepository<PharmacyUser, UUID> {
    Optional<PharmacyUser> findByEmail(String email);
    
    List<PharmacyUser> findByRole(UserRole role);
    
    List<PharmacyUser> findByActiveTrue();
    
    List<PharmacyUser> findByActiveFalse();
    
    @Query("SELECT u FROM PharmacyUser u WHERE u.email LIKE %:term% OR u.fullName LIKE %:term%")
    List<PharmacyUser> searchByEmailOrName(@Param("term") String term);
    
    boolean existsByEmail(String email);
}


