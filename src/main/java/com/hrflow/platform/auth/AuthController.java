package com.hrflow.platform.auth;
import com.hrflow.platform.common.ApiModels.*; import io.swagger.v3.oas.annotations.Operation; import jakarta.validation.Valid; import lombok.RequiredArgsConstructor; import org.springframework.http.*; import org.springframework.security.core.Authentication; import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/v1/auth") @RequiredArgsConstructor
public class AuthController {private final AuthService service;
 @PostMapping("/register") @ResponseStatus(HttpStatus.CREATED) @Operation(summary="Créer un compte") Message register(@Valid @RequestBody Register in){return service.register(in);}
 @PostMapping("/login") TokenResponse login(@Valid @RequestBody Login in){return service.login(in);}
 @GetMapping("/verify-email") Message verify(@RequestParam String token){return service.verify(token);}
 @PostMapping("/resend-verification") Message resend(@Valid @RequestBody EmailInput in){return service.resend(in);}
 @PostMapping("/forgot-password") Message forgot(@Valid @RequestBody EmailInput in){return service.forgot(in);}
 @PostMapping("/reset-password") Message reset(@Valid @RequestBody ResetPassword in){return service.reset(in);}
 @GetMapping("/me") UserView me(Authentication a){return service.me(a.getName());}
}
