package com.hrflow.platform.dashboard;
import com.hrflow.platform.common.ApiModels.Dashboard; import lombok.RequiredArgsConstructor; import org.springframework.security.access.prepost.PreAuthorize; import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/v1/dashboard") @RequiredArgsConstructor @PreAuthorize("hasAnyRole('ADMIN','HR','MANAGER')") public class DashboardController {private final DashboardService service;@GetMapping("/summary")Dashboard summary(){return service.summary();}}
