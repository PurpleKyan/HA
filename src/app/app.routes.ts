import { Routes } from '@angular/router';
import { roleGuard } from './guards';
import { LoginComponent } from './pages/login.component';
import { ForgotPasswordComponent } from './pages/forgot-password.component';
import { ResetPasswordComponent } from './pages/reset-password.component';
import { RegisterComponent } from './pages/register.component';
import { TrailsComponent } from './pages/trails.component';
import { TrailDetailComponent } from './pages/trail-detail.component';
import { RecommendComponent } from './pages/recommend.component';
import { MyBookingsComponent } from './pages/hiker/my-bookings.component';
import { GuideDashboardComponent } from './pages/guide/guide-dashboard.component';
import { AdminDashboardComponent } from './pages/admin/admin-dashboard.component';
import { HomeComponent } from './pages/home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'trails', component: TrailsComponent },
  { path: 'trails/:id', component: TrailDetailComponent },
  { path: 'recommend', component: RecommendComponent, canActivate: [roleGuard('hiker', 'admin')] },
  { path: 'my-bookings', component: MyBookingsComponent, canActivate: [roleGuard('hiker')] },
  { path: 'guide', component: GuideDashboardComponent, canActivate: [roleGuard('guide')] },
  { path: 'admin', component: AdminDashboardComponent, canActivate: [roleGuard('admin')] },
  { path: '**', redirectTo: 'login' },
];
