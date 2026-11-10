import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject, Subscription, catchError, of, switchMap, tap } from 'rxjs';
import { ApiService } from '../api.service';
import { CATEGORIES, DIFFICULTIES, TRIP_TYPES, Trail } from '../models';
import { AppIconComponent } from '../shared/app-icon.component';
import { TrailCardComponent } from '../shared/trail-card.component';
import { ToastService } from '../toast.service';
import { errMsg } from '../utils';

@Component({
  selector: 'app-trails',
  standalone: true,
  imports: [FormsModule, AppIconComponent, TrailCardComponent],
  template: `
    <section class="page-head">
      <div class="container">
        <h1 class="h-xl">Explore trails</h1>
        <p>Discover verified trails across Davao.</p>
      </div>
    </section>

    <section class="container section tight">
      <div class="filters card card-pad">
        <div class="field grow">
          <label>Search</label>
          <input type="text" [ngModel]="search" (ngModelChange)="search = $event; onSearchInput()" placeholder="Name, town or keyword…" />
        </div>
        <div class="field">
          <label>Location</label>
          <select [ngModel]="location" (ngModelChange)="location = $event; load()">
            <option value="">All locations</option>
            @for (l of locations; track l) {
              <option [value]="l">{{ l }}</option>
            }
          </select>
        </div>
        <div class="field">
          <label>Category</label>
          <select [ngModel]="category" (ngModelChange)="category = $event; load()">
            <option value="">All categories</option>
            @for (c of categories; track c) {
              <option [value]="c">{{ c }}</option>
            }
          </select>
        </div>
        <div class="field">
          <label>Difficulty</label>
          <select [ngModel]="difficulty" (ngModelChange)="difficulty = $event; load()">
            <option value="">Any</option>
            @for (d of difficulties; track d) {
              <option [value]="d">{{ d }}</option>
            }
          </select>
        </div>
        <div class="field">
          <label>Trip</label>
          <select [ngModel]="tripType" (ngModelChange)="tripType = $event; load()">
            <option value="">Any</option>
            @for (t of tripTypes; track t) {
              <option [value]="t">{{ t }}</option>
            }
          </select>
        </div>
        <div class="field">
          <label>Max budget / hiker (₱)</label>
          <input type="number" min="0" [ngModel]="budget" (ngModelChange)="budget = $event; onSearchInput()" placeholder="e.g. 1500" />
        </div>
        <div class="field">
          <label>Sort by</label>
          <select [ngModel]="sort" (ngModelChange)="sort = $event; load()">
            <option value="name">Name (A–Z)</option>
            <option value="rating">Top rated</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </select>
        </div>
        <button class="btn btn-ghost" type="button" (click)="reset()">Reset</button>
      </div>

      <p class="muted" style="margin:16px 0 10px">
        @if (!loading) { <b>{{ trails.length }}</b> trail{{ trails.length === 1 ? '' : 's' }} found }
      </p>

      <div class="grid grid-3">
        @if (loading) {
          <div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>
        } @else {
          @for (t of trails; track t.id) {
            <app-trail-card [trail]="t" />
          } @empty {
            <div class="empty" style="grid-column:1/-1">
              <app-icon name="hiking" />
              <h3>No trails match your filters</h3>
              <p class="muted">Try removing a filter or increasing your budget.</p>
              <button class="btn btn-primary" (click)="reset()">Clear filters</button>
            </div>
          }
        }
      </div>
    </section>
  `,
})
export class TrailsComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  categories = CATEGORIES.filter((category) => category !== 'Waterfall');
  difficulties = DIFFICULTIES;
  tripTypes = TRIP_TYPES;
  locations: string[] = [];
  trails: Trail[] = [];
  loading = true;

  search = '';
  location = '';
  category = '';
  difficulty = '';
  tripType = '';
  budget: number | null = null;
  sort = 'name';

  private trigger$ = new Subject<void>();
  private sub?: Subscription;
  private timer: any;

  ngOnInit() {
    this.search = this.route.snapshot.queryParamMap.get('search') || '';

    this.api.locations().subscribe({ next: (l) => (this.locations = l), error: () => {} });

    this.sub = this.trigger$
      .pipe(
        tap(() => (this.loading = true)),
        switchMap(() =>
          this.api.trails(this.params()).pipe(
            catchError((e) => {
              this.toast.err(errMsg(e));
              return of([] as Trail[]);
            })
          )
        )
      )
      .subscribe((list) => {
        this.trails = list;
        this.loading = false;
      });

    this.load();
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    clearTimeout(this.timer);
  }

  private params() {
    return {
      search: this.search.trim(),
      location: this.location,
      category: this.category,
      difficulty: this.difficulty,
      trip_type: this.tripType,
      max_budget: this.budget && this.budget > 0 ? this.budget : '',
      sort: this.sort,
    };
  }

  load() {
    this.trigger$.next();
  }

  onSearchInput() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.load(), 350);
  }

  reset() {
    this.search = '';
    this.location = '';
    this.category = '';
    this.difficulty = '';
    this.tripType = '';
    this.budget = null;
    this.sort = 'name';
    this.load();
  }
}