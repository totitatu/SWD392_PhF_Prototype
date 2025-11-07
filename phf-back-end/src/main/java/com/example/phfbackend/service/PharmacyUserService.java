package com.example.phfbackend.service;

import com.example.phfbackend.entities.user.PharmacyUser;
import com.example.phfbackend.entities.user.UserRole;
import com.example.phfbackend.repository.PharmacyUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class PharmacyUserService {
    
    private final PharmacyUserRepository userRepository;
    
    public PharmacyUser createUser(PharmacyUser user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new IllegalArgumentException("User with email " + user.getEmail() + " already exists");
        }
        return userRepository.save(user);
    }
    
    @Transactional(readOnly = true)
    public Optional<PharmacyUser> findById(UUID id) {
        return userRepository.findById(id);
    }
    
    @Transactional(readOnly = true)
    public Optional<PharmacyUser> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
    
    @Transactional(readOnly = true)
    public List<PharmacyUser> findAll() {
        return userRepository.findAll();
    }
    
    @Transactional(readOnly = true)
    public List<PharmacyUser> findByRole(UserRole role) {
        return userRepository.findByRole(role);
    }
    
    @Transactional(readOnly = true)
    public List<PharmacyUser> findActiveUsers() {
        return userRepository.findByActiveTrue();
    }
    
    @Transactional(readOnly = true)
    public List<PharmacyUser> search(String term) {
        return userRepository.searchByEmailOrName(term);
    }
    
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
    
    public void deactivateUser(UUID id) {
        PharmacyUser user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));
        user.deactivate();
        userRepository.save(user);
    }
    
    public void activateUser(UUID id) {
        PharmacyUser user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));
        user.activate();
        userRepository.save(user);
    }
    
    public void deleteUser(UUID id) {
        userRepository.deleteById(id);
    }
}


