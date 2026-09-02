import { Routes } from '@angular/router';
export default [
 {path:'',pathMatch:'full',redirectTo:'dashboard'},
 {path:'dashboard',loadComponent:()=>import('./recruitment-page').then(m=>m.RecruitmentPage),data:{mode:'dashboard'}},
 {path:'offres',loadComponent:()=>import('./recruitment-page').then(m=>m.RecruitmentPage),data:{mode:'offers'}},
 {path:'offres/nouvelle',loadComponent:()=>import('./recruitment-page').then(m=>m.RecruitmentPage),data:{mode:'offers',create:true}},
 {path:'candidats',loadComponent:()=>import('./recruitment-page').then(m=>m.RecruitmentPage),data:{mode:'candidates'}},
 {path:'candidats/:id',loadComponent:()=>import('./recruitment-page').then(m=>m.RecruitmentPage),data:{mode:'candidates'}},
 {path:'candidatures',loadComponent:()=>import('./recruitment-page').then(m=>m.RecruitmentPage),data:{mode:'applications'}},
 {path:'pipeline',loadComponent:()=>import('./recruitment-page').then(m=>m.RecruitmentPage),data:{mode:'pipeline'}},
 {path:'entretiens',loadComponent:()=>import('./recruitment-page').then(m=>m.RecruitmentPage),data:{mode:'interviews'}},
 {path:'evaluations',loadComponent:()=>import('./recruitment-page').then(m=>m.RecruitmentPage),data:{mode:'evaluations'}},
] satisfies Routes;
