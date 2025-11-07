package com.example.phfbackend.service.impl;

import com.example.phfbackend.dto.UserFilterCriteria;
import com.example.phfbackend.entities.user.PharmacyUser;
import com.example.phfbackend.entities.user.UserRole;
import com.example.phfbackend.repository.PharmacyUserRepository;
import com.example.phfbackend.service.PharmacyUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Transactional
public class PharmacyUserServiceImpl implements PharmacyUserService {
    
    private final PharmacyUserRepository userRepository;
    
    @Override
    public PharmacyUser createUser(PharmacyUser user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new IllegalArgumentException("User with email " + user.getEmail() + " already exists");
        }
        return userRepository.save(user);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<PharmacyUser> findById(UUID id) {
        return userRepository.findById(id);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<PharmacyUser> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<PharmacyUser> findAll() {
        return userRepository.findAll();
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<PharmacyUser> findByRole(UserRole role) {
        return userRepository.findByRole(role);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<PharmacyUser> findActiveUsers() {
        return userRepository.findByActiveTrue();
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<PharmacyUser> search(String term) {
        return userRepository.searchByEmailOrName(term);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<PharmacyUser> filterUsers(UserFilterCriteria criteria) {
        Stream<PharmacyUser> stream = userRepository.findAll().stream();
        
        if (criteria.getSearchTerm() != null && !criteria.getSearchTerm().trim().isEmpty()) {
            String term = criteria.getSearchTerm().trim().toLowerCase();
            stream = stream.filter(user -> 
                user.getEmail().toLowerCase().contains(term) || 
                user.getFullName().toLowerCase().contains(term)
            );
        }
        
        if (criteria.getRole() != null) {
            stream = stream.filter(user -> user.getRole() == criteria.getRole());
        }
        
        if (criteria.getActive() != null) {
            stream = stream.filter(user -> user.isActive() == criteria.getActive());
        }
        
        return stream.toList();
    }
    
    @Override
    public PharmacyUser updateUser(UUID id, PharmacyUser updatedUser) {
        PharmacyUser user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));
        user.updateProfile(updatedUser.getFullName(), updatedUser.getEmail());
        user.updateRole(updatedUser.getRole());
        if (updatedUser.getPasswordHash() != null && !updatedUser.getPasswordHash().isEmpty()) {
            user.updatePassword(updatedUser.getPasswordHash());
        }
        return userRepository.save(user);
    }
    
    @Override
    public void deactivateUser(UUID id) {
        PharmacyUser user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));
        user.deactivate();
        userRepository.save(user);
    }
    
    @Override
    public void activateUser(UUID id) {
        PharmacyUser user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));
        user.activate();
        userRepository.save(user);
    }
    
    @Override
    public void deleteUser(UUID id) {
        userRepository.deleteById(id);
    }
}


