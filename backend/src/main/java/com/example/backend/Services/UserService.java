package com.example.backend.Services;

import com.example.backend.Entity.User;
import com.example.backend.Repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.security.core.userdetails.UserDetailsService;


import java.util.Collections;
import java.util.Optional;

@Service
public class UserService implements UserDetailsService{

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    public boolean authenticateUser(String email, String password) {
        Optional<User> user = userRepository.findByEmail(email);

        if (user.isPresent()) {
            if (passwordEncoder.matches(password, user.get().getPassword())) {
                return true;
            } else {
                System.out.println("Password does not match.");
                return false;
            }
        } else {
            System.out.println("User not found for email: " + email);
            return false;
        }
    }
    public boolean checkEmailExists(String email) {
        return userRepository.findByEmail(email).isPresent();
    }


    public boolean updatePassword(String email, String newPassword, String confirmPassword) {
        if (!newPassword.equals(confirmPassword)) {
            return false;
        }

        Optional<User> userOptional = userRepository.findByEmail(email);
        if (userOptional.isPresent()) {
            User user = userOptional.get();

            String hashedPassword = passwordEncoder.encode(newPassword);
            user.setPassword(hashedPassword);
            userRepository.save(user);
            return true;
        }

        return false;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(), user.getPassword(), Collections.emptyList()
        );
    }

    /**
     * Registers a new user with email and password.
     * return true if registration is successful, false if the email is already registered.
     */
    public boolean registerUser(String email, String password) {
        if (checkEmailExists(email)) {
            System.out.println("Email is already registered: " + email);
            return false;
        }

        User newUser = new User();
        newUser.setEmail(email);
        newUser.setPassword(passwordEncoder.encode(password));

        userRepository.save(newUser);
        System.out.println("User registered successfully: " + email);
        return true;
    }

}