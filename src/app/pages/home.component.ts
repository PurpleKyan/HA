import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../api.service';
import { AuthService } from '../auth.service';
import { Trail } from '../models';
import { AppIconComponent } from '../shared/app-icon.component';
import { TrailCardComponent } from '../shared/trail-card.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, FormsModule, AppIconComponent, TrailCardComponent],
  template: `
    <!-- HERO -->
    <section class="hero">
      <div class="container hero-in">
        <span class="eyebrow"><app-icon name="hiking" /> Davao Region trail discovery</span>
        <h1>Find your next <em>trail</em>,<br />book your guide in minutes.</h1>
        <p class="hero-sub">
          Search verified hiking trails, get recommendations that fit your budget,
          and send reservation requests to local guides, all in one place.
        </p>
        <form class="hero-search" (ngSubmit)="search()">
          <input type="text" name="q" [(ngModel)]="query" placeholder="Search a mountain or town…" />
          <button class="btn btn-accent" type="submit">Search trails</button>
        </form>
        <div class="hero-links">
          <a routerLink="/trails">Browse all trails →</a>
        </div>
      </div>
      <svg class="hero-mtn" viewBox="0 0 1440 220" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 220 L0 150 L180 70 L300 130 L460 40 L640 150 L780 90 L960 170 L1130 60 L1290 140 L1440 90 L1440 220 Z" fill="#2c7a58" opacity=".55" />
        <path d="M0 220 L0 175 L140 120 L280 170 L450 100 L620 180 L820 120 L1010 190 L1200 120 L1440 180 L1440 220 Z" fill="#fffdf8" />
      </svg>
    </section>

    <!-- CHOOSE LOGIN -->
    @if (!auth.isLoggedIn()) {
      <section class="container section tight">
        <div class="center">
          <h2 class="h-lg">How would you like to sign in?</h2>
          <p class="muted">Pick your role and we will take you to the right dashboard.</p>
        </div>
        <div class="grid grid-3" style="margin-top:22px">
          <a class="role-card" routerLink="/login" [queryParams]="{ role: 'hiker' }">
            <span class="role-ico"><img src="/hiker.png" alt="" /></span>
            <h3>Hiker</h3>
            <p>Browse trails, get ranked recommendations, book a guide and review your treks.</p>
            <span class="role-go">Log in as Hiker →</span>
          </a>
          <a class="role-card" routerLink="/login" [queryParams]="{ role: 'guide' }">
            <span class="role-ico"><img src="/tour-guide.png" alt="" /></span>
            <h3>Guide / Tourism Officer</h3>
            <p>Manage your trail listings, set visitor limits, and approve or complete requests.</p>
            <span class="role-go">Log in as Guide →</span>
          </a>
          <a class="role-card" routerLink="/login" [queryParams]="{ role: 'admin' }">
            <span class="role-ico"><img src="/administrator.png" alt="" /></span>
            <h3>Administrator</h3>
            <p>Verify new destinations, manage user accounts and monitor platform activity.</p>
            <span class="role-go">Log in as Admin →</span>
          </a>
        </div>
      </section>
    }

    <!-- FEATURED -->
    <section class="container section">
      <div class="row between">
        <div>
          <h2 class="h-lg">Top-rated trails</h2>
          <p class="muted">Highest-rated destinations from verified hikers.</p>
        </div>
        <a routerLink="/trails" class="btn btn-ghost">See all trails</a>
      </div>
      <div class="grid grid-3" style="margin-top:18px">
        @for (t of featured; track t.id) {
          <app-trail-card [trail]="t" />
        } @empty {
          @if (loading) {
            <div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>
          } @else {
            <p class="muted">No trails to show yet.</p>
          }
        }
      </div>
    </section>

    <!-- HOW IT WORKS -->
    <section class="band">
      <div class="container section">
        <h2 class="h-lg center">How HikeVista works</h2>
        <div class="grid grid-4" style="margin-top:24px">
          <div class="step"><span>1</span><h4>Discover</h4><p>Search and filter by budget, difficulty, location and trip type.</p></div>
          <div class="step"><span>2</span><h4>Get matched</h4><p>Trails are ranked by <b>Preference Match (40%)</b>, <b>Budget Fit (35%)</b>, and <b>Rating Score (25%)</b>.</p></div>
          <div class="step"><span>3</span><h4>Request</h4><p>Send a booking request with your date, group size and itinerary.</p></div>
          <div class="step"><span>4</span><h4>Hike &amp; review</h4><p>Track your status, complete the trek and rate the trail.</p></div>
        </div>
      </div>
    </section>

    <section class="container section">
      <div class="grid grid-3">
        <div class="card card-pad"><h4><app-icon name="map" /> Maps &amp; directions</h4><p class="muted">Every trail page shows its location pin and a link to directions.</p></div>
        <div class="card card-pad"><h4><app-icon name="safety" /> Safety first</h4><p class="muted">Permits, safety advisories and Leave No Trace principles are on every trail page.</p></div>
        <div class="card card-pad"><h4><app-icon name="leaf" /> Supports local guides</h4><p class="muted">Bookings go straight to local guides and tourism offices, supporting sustainable tourism.</p></div>
      </div>
    </section>
  `,
})
export class HomeComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  auth = inject(AuthService);

  query = '';
  featured: Trail[] = [];
  loading = true;

  ngOnInit() {
    this.api.trails({ sort: 'rating' }).subscribe({
      next: (list) => {
        this.featured = list.slice(0, 3);
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  search() {
    this.router.navigate(['/trails'], { queryParams: { search: this.query.trim() || null } });
  }
}