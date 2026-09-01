package com.hrflow.platform.security;
import com.hrflow.platform.user.User; import io.jsonwebtoken.*; import io.jsonwebtoken.security.Keys; import org.springframework.beans.factory.annotation.Value; import org.springframework.stereotype.Service; import javax.crypto.SecretKey; import java.nio.charset.StandardCharsets; import java.time.*; import java.util.Date;
@Service
public class JwtService { private final SecretKey key; private final Duration expiration;
 public JwtService(@Value("${hrflow.jwt.secret}")String secret,@Value("${hrflow.jwt.expiration:PT1H}")Duration expiration){if(secret.getBytes(StandardCharsets.UTF_8).length<32)throw new IllegalStateException("JWT_SECRET must contain at least 32 bytes");this.key=Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));this.expiration=expiration;}
 public String generate(User u){Instant now=Instant.now();return Jwts.builder().subject(u.getEmail()).claim("role",u.getRole().name()).issuedAt(Date.from(now)).expiration(Date.from(now.plus(expiration))).signWith(key).compact();}
 public String subject(String token){return parser().parseSignedClaims(token).getPayload().getSubject();}
 public boolean valid(String token,String email){try{return email.equals(subject(token))&&parser().parseSignedClaims(token).getPayload().getExpiration().after(new Date());}catch(JwtException|IllegalArgumentException e){return false;}}
 public long expiresSeconds(){return expiration.toSeconds();} private JwtParser parser(){return Jwts.parser().verifyWith(key).build();}
}
