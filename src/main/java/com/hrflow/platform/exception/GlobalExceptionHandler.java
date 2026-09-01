package com.hrflow.platform.exception;
import jakarta.servlet.http.HttpServletRequest; import org.springframework.dao.DataIntegrityViolationException; import org.springframework.http.*; import org.springframework.http.converter.HttpMessageNotReadableException; import org.springframework.validation.FieldError; import org.springframework.web.bind.*; import org.springframework.web.bind.annotation.*; import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException; import java.time.Instant; import java.util.*;
import org.springframework.security.access.AccessDeniedException;
@RestControllerAdvice
public class GlobalExceptionHandler {
 record ErrorBody(Instant timestamp,int status,String error,String code,String message,String path,Map<String,String> fieldErrors){}
 private ResponseEntity<ErrorBody> body(HttpStatus s,String c,String m,HttpServletRequest r,Map<String,String> f){return ResponseEntity.status(s).body(new ErrorBody(Instant.now(),s.value(),s.getReasonPhrase(),c,m,r.getRequestURI(),f));}
 @ExceptionHandler(ApiException.class) ResponseEntity<ErrorBody> api(ApiException e,HttpServletRequest r){return body(e.status(),e.code(),e.getMessage(),r,null);}
 @ExceptionHandler(MethodArgumentNotValidException.class) ResponseEntity<ErrorBody> validation(MethodArgumentNotValidException e,HttpServletRequest r){Map<String,String> f=new LinkedHashMap<>(); for(FieldError x:e.getBindingResult().getFieldErrors())f.putIfAbsent(x.getField(),x.getDefaultMessage()); return body(HttpStatus.BAD_REQUEST,"VALIDATION_ERROR","La requête contient des champs invalides",r,f);}
 @ExceptionHandler({HttpMessageNotReadableException.class,MethodArgumentTypeMismatchException.class,MissingServletRequestParameterException.class}) ResponseEntity<ErrorBody> bad(Exception e,HttpServletRequest r){return body(HttpStatus.BAD_REQUEST,"INVALID_REQUEST","Requête ou paramètre invalide",r,null);}
 @ExceptionHandler(DataIntegrityViolationException.class) ResponseEntity<ErrorBody> integrity(Exception e,HttpServletRequest r){return body(HttpStatus.CONFLICT,"UNIQUE_CONSTRAINT","Une valeur existe déjà ou viole une contrainte",r,null);}
 @ExceptionHandler(AccessDeniedException.class) ResponseEntity<ErrorBody> forbidden(AccessDeniedException e,HttpServletRequest r){return body(HttpStatus.FORBIDDEN,"ACCESS_DENIED","Accès interdit",r,null);}
 @ExceptionHandler(Exception.class) ResponseEntity<ErrorBody> internal(Exception e,HttpServletRequest r){return body(HttpStatus.INTERNAL_SERVER_ERROR,"INTERNAL_ERROR","Une erreur interne est survenue",r,null);}
}
