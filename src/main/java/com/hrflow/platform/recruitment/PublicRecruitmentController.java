package com.hrflow.platform.recruitment;
import com.hrflow.platform.recruitment.RecruitmentDtos.*; import jakarta.validation.Valid; import lombok.RequiredArgsConstructor; import org.springframework.data.domain.*; import org.springframework.data.web.PageableDefault; import org.springframework.http.*; import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/v1/recruitment/public") @RequiredArgsConstructor public class PublicRecruitmentController {private final RecruitmentService service;
 @GetMapping("/offers")Page<JobOfferView> offers(@RequestParam(required=false)String search,@RequestParam(required=false)Long departmentId,@PageableDefault(sort="publishedAt",direction=Sort.Direction.DESC)Pageable p){return service.listOffers(search,null,departmentId,p,null,true);}
 @PostMapping("/candidates")@ResponseStatus(HttpStatus.CREATED)CandidateView candidate(@Valid @RequestBody CandidateInput i){return service.createCandidate(i,"PUBLIC");}
 @PostMapping("/applications")@ResponseStatus(HttpStatus.CREATED)ApplicationView application(@Valid @RequestBody ApplicationInput i){return service.createApplication(i,"PUBLIC");}
}
