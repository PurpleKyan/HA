import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../api.service';
import { CATEGORIES, DIFFICULTIES, FEATURES, Recommendation, TRIP_TYPES } from '../models';
import { AppIconComponent } from '../shared/app-icon.component';
import { TrailCardComponent } from '../shared/trail-card.component';
import { ToastService } from '../toast.service';
import { errMsg } from '../utils';

@Component({
  selector: 'app-recommend',
  standalone: true,
  imports: [FormsModule, RouterLink, CurrencyPipe, DecimalPipe, AppIconComponent, TrailCardComponent],
  template: `
    <section class="page-head">
      <div class="container">
        <h1 class="h-xl">Trail recommendations</h1>
        <p>Tell us what you want. We rank trails with: Score = 40% Preference Match + 35% Budget Fit + 25% Rating.</p>
      </div>
    </section>

    <section class="container section tight reco-grid">
      <form class="card card-pad reco-form" (ngSubmit)="submit()">
        <h3 class="h-sm">Your preferences</h3>
        <div class="ranking-guide">
          <strong>How trails are ranked</strong>
          <div><span>Preference Match</span><b>40%</b></div>
          <div><span>Budget Fit</span><b>35%</b></div>
          <div><span>Rating Score</span><b>25%</b></div>
        </div>

        <div class="form-grid">
          <div class="field">
            <label>Group budget (₱)</label>
            <input type="number" name="budget" [(ngModel)]="budget" min="1" required />
          </div>
          <div class="field">
            <label>Group size (max 60)</label>
            <div class="group-size-stepper" aria-label="Group size">
              <button type="button" class="group-size-button" aria-label="Decrease group size" [disabled]="group <= 1" (pointerdown)="startGroupAdjustment($event, -1)" (pointerup)="stopGroupAdjustment()" (pointerleave)="stopGroupAdjustment()" (pointercancel)="stopGroupAdjustment()" (click)="onGroupButtonClick(-1)">−</button>
              <output class="group-size-value" aria-live="polite">{{ group }}</output>
              <button type="button" class="group-size-button" aria-label="Increase group size" [disabled]="group >= 60" (pointerdown)="startGroupAdjustment($event, 1)" (pointerup)="stopGroupAdjustment()" (pointerleave)="stopGroupAdjustment()" (pointercancel)="stopGroupAdjustment()" (click)="onGroupButtonClick(1)">+</button>
            </div>
          </div>
        </div>

        <div class="field">
          <label>Location</label>
          <select name="location" [(ngModel)]="location">
            <option value="">Anywhere</option>
            @for (l of locations; track l) {
              <option [value]="l">{{ l }}</option>
            }
          </select>
        </div>
        <div class="field">
          <label>Category</label>
          <select name="category" [(ngModel)]="category">
            <option value="">All categories</option>
            @for (c of categories; track c) {
              <option [value]="c">{{ c }}</option>
            }
          </select>
        </div>
        <div class="form-grid">
          <div class="field">
            <label>Difficulty</label>
            <select name="difficulty" [(ngModel)]="difficulty">
              <option value="">No preference</option>
              @for (d of difficulties; track d) {
                <option [value]="d">{{ d }}</option>
              }
            </select>
          </div>
          <div class="field">
            <label>Trip type</label>
            <select name="tripType" [(ngModel)]="tripType">
              <option value="">No preference</option>
              @for (t of tripTypes; track t) {
                <option [value]="t">{{ t }}</option>
              }
            </select>
          </div>
        </div>

        <div class="field">
          <label>Features you want</label>
          <div class="chips">
            @for (f of featureList; track f) {
              <button type="button" class="chip" [class.on]="features.includes(f)" (click)="toggle(f)">{{ f }}</button>
            }
          </div>
        </div>

        @if (error) {
          <div class="alert alert-error">{{ error }}</div>
        }
        <button class="btn btn-accent btn-block" type="submit" [disabled]="loading">
          <app-icon name="recommend" /> {{ loading ? 'Ranking trails…' : 'Recommend trails' }}
        </button>
        <p class="muted small" style="margin-top:10px">
          Trails above your group budget are excluded. Budget = (entrance fee × group size) + guide fee.
        </p>
      </form>

      <div>
        @if (!searched) {
          <div class="empty">
            <app-icon name="hiking" />
            <h3>Ready when you are</h3>
            <p class="muted">Fill in your preferences and press “Recommend trails”.</p>
          </div>
        } @else if (loading) {
          <div class="skeleton" style="height:180px"></div>
        } @else if (!results.length) {
          <div class="empty">
            <div class="reco-empty-icon" aria-hidden="true">
              <svg viewBox="0 0 64 64" focusable="false">
                <circle cx="32" cy="32" r="30" fill="#e8f3e7" />
                <path d="M8 47 24 22l16 25H8Z" fill="#4f966a" />
                <path d="m20 47 17-28 19 28H20Z" fill="#174431" />
                <path d="m20 28 4-6 4 6-4-2-4 2Zm13-5 4-5 4 7-4-3-4 1Z" fill="#fffdf4" />
                <path d="M14 47c5-5 9-5 13-1" fill="none" stroke="#f4d27d" stroke-linecap="round" stroke-width="2.5" />
                <circle cx="45" cy="40" r="8" fill="#fffdf4" stroke="#123b2a" stroke-width="3" />
                <path d="m51 46 6 6" stroke="#123b2a" stroke-linecap="round" stroke-width="4" />
              </svg>
            </div>
            <h3>No trails fit that budget and filters</h3>
            <p class="muted">Try a higher budget, a smaller group or a different location.</p>
          </div>
        } @else {
          <p class="muted" style="margin-bottom:12px"><b>{{ results.length }}</b> trail(s) ranked from best to lowest match</p>
          @for (r of results; track r.trail.id; let i = $index) {
            <div class="reco-item">
              <div class="reco-card"><app-trail-card [trail]="r.trail" [rank]="i + 1" [score]="r.score" /></div>
              <div class="card card-pad reco-detail">
                <div class="ring" [style.background]="ring(r.score)"><span>{{ r.score | number: '1.0-0' }}<small>%</small></span></div>
                <div class="meter">
                  <div class="meter-row"><span>Preference match (40%)</span><b>{{ r.breakdown.preference_match | number: '1.0-0' }}%</b></div>
                  <div class="bar"><i [style.width.%]="r.breakdown.preference_match"></i></div>
                  <div class="meter-row"><span>Budget fit (35%)</span><b>{{ r.breakdown.budget_fit | number: '1.0-0' }}%</b></div>
                  <div class="bar"><i class="bar-alt" [style.width.%]="r.breakdown.budget_fit"></i></div>
                  <div class="meter-row"><span>Rating score (25%)</span><b>{{ r.breakdown.rating_score | number: '1.0-0' }}%</b></div>
                  <div class="bar"><i class="bar-sun" [style.width.%]="r.breakdown.rating_score"></i></div>
                </div>
                <p class="muted small">Estimated cost for {{ group }} hiker(s): <b>{{ r.estimated_cost | currency: 'PHP' : 'symbol' : '1.0-0' }}</b></p>
                <a class="btn btn-primary btn-sm" [routerLink]="['/trails', r.trail.id]">View &amp; book</a>
              </div>
            </div>
          }
        }
      </div>
    </section>
  `,
})
export class RecommendComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  difficulties = DIFFICULTIES;
  categories = CATEGORIES;
  tripTypes = TRIP_TYPES;
  featureList = FEATURES;
  locations: string[] = [];

  budget = 3000;
  group = 2;
  location = '';
  difficulty = '';
  tripType = '';
  category = '';
  features: string[] = [];

  results: Recommendation[] = [];
  searched = false;
  loading = false;
  error = '';
  private groupAdjustDelay: ReturnType<typeof setTimeout> | null = null;
  private groupAdjustInterval: ReturnType<typeof setInterval> | null = null;
  private suppressGroupClick = false;

  ngOnInit() {
    this.api.locations().subscribe({ next: (l) => (this.locations = l), error: () => {} });
  }

  toggle(f: string) {
    this.features = this.features.includes(f) ? this.features.filter((x) => x !== f) : [...this.features, f];
  }

  adjustGroup(amount: number): void {
    this.group = Math.max(1, Math.min(60, this.group + amount));
  }

  startGroupAdjustment(event: PointerEvent, amount: number): void {
    if (event.button !== 0) return;
    this.stopGroupAdjustment();
    this.suppressGroupClick = false;
    this.groupAdjustDelay = setTimeout(() => {
      this.suppressGroupClick = true;
      this.adjustGroup(amount);
      this.groupAdjustInterval = setInterval(() => this.adjustGroup(amount), 90);
    }, 350);
  }

  stopGroupAdjustment(): void {
    if (this.groupAdjustDelay) clearTimeout(this.groupAdjustDelay);
    if (this.groupAdjustInterval) clearInterval(this.groupAdjustInterval);
    this.groupAdjustDelay = null;
    this.groupAdjustInterval = null;
  }

  onGroupButtonClick(amount: number): void {
    if (this.suppressGroupClick) {
      this.suppressGroupClick = false;
      return;
    }
    this.adjustGroup(amount);
  }

  ring(score: number): string {
    return `conic-gradient(#2f8f5f ${Math.round(score * 3.6)}deg, #e7eadf 0deg)`;
  }

  submit() {
    this.error = '';
    if (!this.budget || this.budget < 1 || !Number.isInteger(this.group) || this.group < 1 || this.group > 60) {
      this.error = 'Please enter a valid budget and group size.';
      return;
    }
    this.loading = true;
    this.searched = true;
    this.api
      .recommend({
        budget: this.budget,
        group_size: this.group,
        location: this.location || null,
        category: this.category || null,
        difficulty: this.difficulty || null,
        trip_type: this.tripType || null,
        features: this.features,
      })
      .subscribe({
        next: (res) => {
          this.results = res;
          this.loading = false;
        },
        error: (e) => {
          this.loading = false;
          this.results = [];
          this.error = errMsg(e);
          this.toast.err(this.error);
        },
      });
  }
}