package com.hrflow.platform.exception;
import org.springframework.http.HttpStatus;
public class ApiException extends RuntimeException { private final HttpStatus status; private final String code; public ApiException(HttpStatus s,String c,String m){super(m);status=s;code=c;} public HttpStatus status(){return status;} public String code(){return code;} public static ApiException notFound(String m){return new ApiException(HttpStatus.NOT_FOUND,"RESOURCE_NOT_FOUND",m);} public static ApiException conflict(String m){return new ApiException(HttpStatus.CONFLICT,"BUSINESS_CONFLICT",m);} }
