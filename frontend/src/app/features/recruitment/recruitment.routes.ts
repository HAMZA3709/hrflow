import { Routes } from '@angular/router';
export default [
 {path:'',pathMatch:'full',redirectTo:'dashboard'},
 {path:'dashboard',loadComponent:()=>import('./dashboard-page').then(m=>m.RecruitmentDashboardPage)},
 {path:'offres',loadComponent:()=>import('./offers-pages').then(m=>m.OffersListPage)},
 {path:'offres/nouvelle',loadComponent:()=>import('./offers-pages').then(m=>m.OfferFormPage)},
 {path:'offres/:id',loadComponent:()=>import('./offers-pages').then(m=>m.OfferDetailPage)},
 {path:'offres/:id/modifier',loadComponent:()=>import('./offers-pages').then(m=>m.OfferFormPage)},
 {path:'candidats',loadComponent:()=>import('./candidate-pages').then(m=>m.CandidatesListPage)},
 {path:'candidats/:id',loadComponent:()=>import('./candidate-pages').then(m=>m.CandidateDetailPage)},
 {path:'candidats/:id/modifier',loadComponent:()=>import('./candidate-pages').then(m=>m.CandidateFormPage)},
 {path:'candidatures',loadComponent:()=>import('./application-pages').then(m=>m.ApplicationsListPage)},
 {path:'candidatures/:id',loadComponent:()=>import('./application-pages').then(m=>m.ApplicationDetailPage)},
 {path:'pipeline',loadComponent:()=>import('./pipeline-page').then(m=>m.PipelinePage)},
 {path:'entretiens',loadComponent:()=>import('./interview-pages').then(m=>m.InterviewsPage)},
 {path:'entretiens/:id',loadComponent:()=>import('./interview-pages').then(m=>m.InterviewDetailPage)},
 {path:'evaluations',loadComponent:()=>import('./interview-pages').then(m=>m.EvaluationPage)},
] satisfies Routes;
