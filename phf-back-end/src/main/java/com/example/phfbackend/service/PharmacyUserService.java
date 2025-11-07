package com.example.phfbackend.service;

import com.example.phfbackend.dto.UserFilterCriteria;
import com.example.phfbackend.entities.user.PharmacyUser;
import com.example.phfbackend.entities.user.UserRole;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PharmacyUserService {
    PharmacyUser createUser(PharmacyUser user);
    
    Optional<PharmacyUser> findById(UUID id);
    
    Optional<PharmacyUser> findByEmail(String email);
    
    List<PharmacyUser> findAll();
    
    List<PharmacyUser> findByRole(UserRole role);
    
    List<PharmacyUser> findActiveUsers();
    
    List<PharmacyUser> search(String term);
    
    List<PharmacyUser> filterUsers(UserFilterCriteria criteria);
    
    PharmacyUser updateUser(UUID id, PharmacyUser updatedUser);
    
    void deactivateUser(UUID id);
    
    void activateUser(UUID id);
    
    void deleteUser(UUID id);
}
