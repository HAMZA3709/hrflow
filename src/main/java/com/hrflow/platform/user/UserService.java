package com.hrflow.platform.user;
import com.hrflow.platform.auth.AuthService; import com.hrflow.platform.common.ApiModels.*; import com.hrflow.platform.exception.ApiException; import lombok.RequiredArgsConstructor; import org.springframework.data.domain.*; import org.springframework.http.HttpStatus; import org.springframework.stereotype.Service; import org.springframework.transaction.annotation.Transactional;
@Service @RequiredArgsConstructor public class UserService {private final UserRepository repo;
 @Transactional(readOnly=true) public Page<UserView> list(String q,Pageable p){return (q==null||q.isBlank()?repo.findAll(p):repo.findByEmailContainingIgnoreCase(q,p)).map(AuthService::view);}
 @Transactional(readOnly=true) public UserView get(Long id){return AuthService.view(entity(id));}
 @Transactional public UserView role(Long id,RoleUpdate in){User u=entity(id);if(u.getRole()==Role.ADMIN&&in.role()!=Role.ADMIN&&u.isEnabled()&&repo.countByRoleAndEnabledTrue(Role.ADMIN)<=1)throw ApiException.conflict("Le dernier administrateur actif ne peut pas perdre son rôle");u.setRole(in.role());return AuthService.view(u);}
 @Transactional public UserView status(Long id,StatusUpdate in){User u=entity(id);if(!in.active()&&u.getRole()==Role.ADMIN&&u.isEnabled()&&repo.countByRoleAndEnabledTrue(Role.ADMIN)<=1)throw ApiException.conflict("Le dernier administrateur actif ne peut pas être désactivé");u.setEnabled(in.active());return AuthService.view(u);} User entity(Long id){return repo.findById(id).orElseThrow(()->ApiException.notFound("Utilisateur introuvable"));}
}
