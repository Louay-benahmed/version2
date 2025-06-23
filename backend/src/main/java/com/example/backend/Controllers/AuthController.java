package com.example.backend.Controllers;

import com.example.backend.Entity.User;
import com.example.backend.Repositories.UserRepository;
import com.example.backend.Services.UserService;
import com.example.backend.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:4200")
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private JavaMailSender javaMailSender;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private AuthenticationManager authenticationManager;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestParam String email, @RequestParam String password) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, password)
            );

            UserDetails userDetails = userService.loadUserByUsername(email);

            String jwtToken = jwtUtil.generateToken(userDetails);

            return ResponseEntity.ok().body(Map.of(
                    "success", true,
                    "message", "Login successful",
                    "token", jwtToken
            ));
        } catch (Exception e) {
            return ResponseEntity.ok().body(Map.of(
                    "success", false,
                    "message", "Invalid email or password"
            ));
        }
    }
    @PostMapping("/check-email")
    public ResponseEntity<?> checkEmailExists(@RequestParam String email) {
        boolean emailExists = userService.checkEmailExists(email);

        if (emailExists) {
            return ResponseEntity.ok().body(Map.of("exists", true, "message", "Email exists"));
        } else {
            return ResponseEntity.ok().body(Map.of("exists", false, "message", "Email does not exist"));
        }
    }

    @PostMapping("/update_password")
    public ResponseEntity<?> updatePassword(
            @RequestParam String email,
            @RequestParam String newPassword,
            @RequestParam String confirmPassword
    ) {
        boolean isUpdated = userService.updatePassword(email, newPassword, confirmPassword);

        if (isUpdated) {
            return ResponseEntity.ok().body(Map.of("success", true, "message", "Password updated successfully"));
        } else {
            return ResponseEntity.ok().body(Map.of("success", false, "message", "Failed to update password"));
        }
    }

    @PostMapping("/send_code")
    public ResponseEntity<?> sendCode(
            @RequestParam String code,
            @RequestParam String recipientEmail
    ) {
        if (code == null || code.isEmpty() || recipientEmail == null || recipientEmail.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Both code and recipient email are required"));
        }

        try {
            SimpleMailMessage mailMessage = new SimpleMailMessage();
            mailMessage.setFrom("benahmedlouay220@gmail.com");
            mailMessage.setTo(recipientEmail);
            mailMessage.setSubject("Code de vérification");
            mailMessage.setText("Votre code de vérification est : " + code);

            javaMailSender.send(mailMessage);

            return ResponseEntity.ok().body(Map.of("message", "Email sent successfully"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Error sending email: " + e.getMessage()));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<String> registerUser(@RequestParam String email, @RequestParam String password) {
        if (userService.registerUser(email, password)) {
            return ResponseEntity.ok("User registered successfully!");
        } else {
            return ResponseEntity.badRequest().body("Registration failed. Email already exists.");
        }
    }
}
