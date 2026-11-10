import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Trail } from '../models';
import { categoryIcon, coverBackground, diffClass } from '../utils';
import { AppIconComponent } from './app-icon.component';

@Component({
  selector: 'app-trail-card',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DecimalPipe, AppIconComponent],
  template: `
    <a class="tcard" [routerLink]="['/trails', trail.id]">
      <div class="tcover" [style.background]="cover()">
        <img class="tcover-icon" [src]="icon()" alt="" />
        <span class="badge b-glass">{{ trail.category }}</span>
        @if (rank) {
          <span class="rank">#{{ rank }}</span>
        }
        @if (score !== null && score !== undefined) {
          <span class="score-pill">{{ score }}% match</span>
        }
      </div>
      <div class="tbody">
        <div class="row between">
          <span [class]="'badge ' + diff(trail.difficulty)">{{ trail.difficulty }}</span>
          <span class="badge b-gray">{{ trail.trip_type }}</span>
        </div>
        <h3 class="tname">{{ trail.name }}</h3>
        <p class="tloc"><app-icon name="location" /> {{ trail.location }}</p>
        <div class="tstats">
          <span><app-icon name="distance" /> {{ trail.distance_km | number: '1.0-1' }} km</span>
          <span><app-icon name="timer" /> {{ trail.duration_hours | number: '1.0-1' }} h</span>
          <span><app-icon name="elevation" /> {{ trail.elevation | number: '1.0-0' }} m</span>
        </div>
        <div class="tfoot">
          <div>
            <small class="muted">From</small>
            <strong>{{ trail.entrance_fee | currency: 'PHP' : 'symbol' : '1.0-0' }}</strong>
            <small class="muted"> / hiker</small>
          </div>
          <div class="trating">
            @if (trail.reviews_count > 0) {
              <app-icon name="star" /> {{ trail.avg_rating | number: '1.1-1' }}
              <small class="muted">({{ trail.reviews_count }})</small>
            } @else {
              <small class="muted">No reviews yet</small>
            }
          </div>
        </div>
      </div>
    </a>
  `,
})
export class TrailCardComponent {
  @Input({ required: true }) trail!: Trail;
  @Input() score: number | null = null;
  @Input() rank: number | null = null;

  diff = diffClass;

  cover() {
    return coverBackground(this.trail);
  }
  icon() {
    return categoryIcon(this.trail.category);
  }
}