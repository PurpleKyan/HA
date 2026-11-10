import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './auth.service';
import { ConfirmationDialogComponent } from './shared/confirmation-dialog.component';
import { ToastComponent } from './shared/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastComponent, ConfirmationDialogComponent],
  template: `
    <header class="nav">
      <div class="container nav-in">
        <a routerLink="/" class="brand" (click)="menu = false">
          <svg viewBox="0 0 48 48" width="40" height="40" aria-hidden="true">
            <defs>
              <linearGradient id="hikevista-logo-bg" x1="7" y1="3" x2="42" y2="47" gradientUnits="userSpaceOnUse"><stop stop-color="#245b40" /><stop offset=".55" stop-color="#174431" /><stop offset="1" stop-color="#0b3025" /></linearGradient>
              <linearGradient id="hikevista-logo-sky" x1="24" y1="6" x2="24" y2="37" gradientUnits="userSpaceOnUse"><stop stop-color="#397456" /><stop offset=".62" stop-color="#d7a85a" /><stop offset="1" stop-color="#f0c77b" /></linearGradient>
              <linearGradient id="hikevista-logo-far-range" x1="18" y1="15" x2="28" y2="37" gradientUnits="userSpaceOnUse"><stop stop-color="#9bb69a" /><stop offset="1" stop-color="#50755a" /></linearGradient>
              <linearGradient id="hikevista-logo-peak" x1="18" y1="15" x2="34" y2="42" gradientUnits="userSpaceOnUse"><stop stop-color="#f8f2de" /><stop offset=".48" stop-color="#dce4ce" /><stop offset="1" stop-color="#91ad8a" /></linearGradient>
              <linearGradient id="hikevista-logo-shadow" x1="27" y1="23" x2="39" y2="40" gradientUnits="userSpaceOnUse"><stop stop-color="#a8bb9c" /><stop offset="1" stop-color="#66866d" /></linearGradient>
              <linearGradient id="hikevista-logo-trail" x1="24" y1="24" x2="29" y2="42" gradientUnits="userSpaceOnUse"><stop stop-color="#fff4cc" /><stop offset="1" stop-color="#e8b955" /></linearGradient>
              <clipPath id="hikevista-logo-landscape"><rect x="3.5" y="3.5" width="41" height="41" rx="12" /></clipPath>
            </defs>
            <rect width="48" height="48" rx="14" fill="url(#hikevista-logo-bg)" />
            <g clip-path="url(#hikevista-logo-landscape)">
              <rect x="3.5" y="3.5" width="41" height="41" fill="url(#hikevista-logo-sky)" />
              <circle cx="35.5" cy="13" r="4" fill="#fbe6a4" opacity=".92" />
              <circle cx="35.5" cy="13" r="6.5" fill="#fbe6a4" opacity=".13" />
              <path d="M4 31 12 22l4 4 7-10 10 13v8H4Z" fill="url(#hikevista-logo-far-range)" />
              <path d="m7 39 13-23 7 10 4-6 13 19H7Z" fill="url(#hikevista-logo-peak)" />
              <path d="m20 16 7 10-5-2-2 3-3-2-3 5 6-14Z" fill="#fffdf4" />
              <path d="m27 26 4-6 13 19H27l5-8-5-5Z" fill="url(#hikevista-logo-shadow)" />
              <path d="M4 37c6-2 8-1 12 2s8 3 12 0 9-4 16-2v8H4Z" fill="#174431" />
              <path d="M27 27c-3 2-4 4-3 6 .8 1.6 3.2 1.6 3.8 3 .7 1.8-2.1 3.6-4.3 5.2" fill="none" stroke="url(#hikevista-logo-trail)" stroke-width="1.7" stroke-linecap="round" />
              <path d="M20 17.5 22 14l2 3.5" fill="none" stroke="#fff8e6" stroke-opacity=".8" stroke-width=".7" stroke-linecap="round" stroke-linejoin="round" />
            </g>
            <rect x=".65" y=".65" width="46.7" height="46.7" rx="14" fill="none" stroke="#f1ca70" stroke-opacity=".8" stroke-width="1.3" />
            <path d="m9 8 1.2 2.4L13 11l-2.8.8L9 14l-1.1-2.2L5 11l2.9-.6L9 8Z" fill="#fff0bd" opacity=".9" />
          </svg>
          <span>HikeVista<small>TrailQuest</small></span>
        </a>
        <button class="burger" (click)="menu = !menu" aria-label="Menu">{{ menu ? '✕' : '☰' }}</button>
        <nav class="links" [class.open]="menu" (click)="menu = false">
          <a routerLink="/trails" routerLinkActive="active">Explore Trails</a>
          @if (auth.role() === 'hiker' || auth.role() === 'admin') { <a routerLink="/recommend" routerLinkActive="active">Recommendations</a> }
          @if (auth.role() === 'hiker') { <a routerLink="/my-bookings" routerLinkActive="active">My Bookings</a> }
          @if (auth.role() === 'guide') { <a routerLink="/guide" routerLinkActive="active">Guide Dashboard</a> }
          @if (auth.role() === 'admin') { <a routerLink="/admin" routerLinkActive="active">Admin Dashboard</a> }
          @if (auth.isLoggedIn()) {
            <span class="user-chip"><span class="avatar">{{ initial() }}</span><span class="user-txt"><b>{{ auth.user()?.name }}</b><small>{{ roleLabel() }}</small></span></span>
            <button class="btn btn-ghost btn-sm" (click)="logout()">Log out</button>
          } @else {
            <a routerLink="/login" class="btn btn-ghost btn-sm">Log in</a><a routerLink="/register" class="btn btn-accent btn-sm">Sign up</a>
          }
        </nav>
      </div>
    </header>
    <main><router-outlet /></main>
    <footer class="footer"><div class="container foot-in"><div><b>HikeVista: TrailQuest</b><p>A web-based hiking trail discovery and information platform in the Davao Region.</p></div><div class="foot-links"><a routerLink="/trails">Trails</a></div></div><p class="foot-note">Leave No Trace · Hike with an accredited guide · Always check trail advisories</p></footer>
    <app-toast />
    <app-confirmation-dialog />
  `,
})
export class AppComponent implements OnInit {
  auth = inject(AuthService);
  menu = false;

  ngOnInit() { this.auth.refreshUser(); }
  initial() { return (this.auth.user()?.name || '?').charAt(0).toUpperCase(); }
  roleLabel() { const r = this.auth.role(); return r === 'guide' ? 'Guide / Officer' : r === 'admin' ? 'Administrator' : 'Hiker'; }
  logout() { this.menu = false; this.auth.logout(); }
}
