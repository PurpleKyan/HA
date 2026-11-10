import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { AppIconComponent } from '../../shared/app-icon.component';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../api.service';
import { ConfirmationService } from '../../confirmation.service';
import { BOOKING_STATUSES, Booking } from '../../models';
import { ToastService } from '../../toast.service';
import { coverBackground, errMsg, statusClass } from '../../utils';

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [FormsModule, RouterLink, CurrencyPipe, DatePipe, AppIconComponent],
  template: `
    <section class="page-head">
      <div class="container">
        <h1 class="h-xl">My bookings</h1>
        <p>Track your reservation requests and review your completed treks.</p>
      </div>
    </section>

    <section class="container section tight">
      <div class="tabs">
        <button class="tab" [class.active]="filter === ''" (click)="filter = ''">All ({{ bookings.length }})</button>
        @for (s of statuses; track s) {
          <button class="tab" [class.active]="filter === s" (click)="filter = s">{{ s }} ({{ count(s) }})</button>
        }
      </div>

      @if (loading) {
        <div class="skeleton" style="height:160px"></div>
      } @else {
        @for (b of visible(); track b.id) {
          <article class="card booking">
            <div class="booking-cover" [style.background]="cover(b)"></div>
            <div class="booking-body">
              <div class="row between" style="flex-wrap:wrap;gap:8px">
                <div>
                  <small class="muted">Booking ID</small>
                  <div class="code sm">{{ b.booking_code }}</div>
                </div>
                <span [class]="'badge ' + sClass(b.status)">{{ b.status }}</span>
              </div>
              <h3 class="h-sm" style="margin:10px 0 2px">
                <a [routerLink]="['/trails', b.trail_id]">{{ b.trail?.name }}</a>
              </h3>
              <p class="muted"><app-icon name="location" /> {{ b.trail?.location }}</p>
              <div class="kv">
                <span>📅 <b>{{ b.trek_date | date: 'mediumDate' }}</b></span>
                <span><app-icon name="group" /> <b>{{ b.group_size }}</b> hiker(s)</span>
                <span><app-icon name="money" /> <b>{{ b.total_cost | currency: 'PHP' : 'symbol' : '1.0-0' }}</b></span>
              </div>

              <div class="timeline">
                @for (l of b.logs || []; track l.id) {
                  <div class="tl-item">
                    <i [class]="'dot ' + sClass(l.status)"></i>
                    <b>{{ l.status }}</b>
                    <small class="muted">{{ l.created_at | date: 'MMM d, y, h:mm a' }}</small>
                  </div>
                }
              </div>

              <div class="row" style="gap:8px;margin-top:12px;flex-wrap:wrap">
                @if (b.status === 'Pending' || b.status === 'Approved') {
                  <button class="btn btn-ghost btn-sm danger-text" (click)="cancel(b)">Cancel request</button>
                }
                @if (b.status === 'Completed' && !b.review) {
                  <button class="btn btn-accent btn-sm" (click)="openReview(b)"><app-icon name="star" /> Rate this trek</button>
                }
                @if (b.review) {
                  <span class="muted small">Your rating: @for (_ of filledStars(b.review.rating); track $index) { <app-icon name="star" /> }</span>
                }
                @if (b.status === 'Completed') {
                  <button class="btn btn-ghost btn-sm danger-text" type="button" [disabled]="deletingBookingIds.has(b.id)" (click)="deleteCompletedBooking(b)">
                    {{ deletingBookingIds.has(b.id) ? 'Deleting…' : 'Delete booking history' }}
                  </button>
                }
              </div>
            </div>
          </article>
        } @empty {
          <div class="empty">
            <app-icon name="hiking" />
            <h3>No bookings here yet</h3>
            <p class="muted">Pick a trail and send your first reservation request.</p>
            <a routerLink="/trails" class="btn btn-primary">Explore trails</a>
          </div>
        }
      }
    </section>

    <!-- REVIEW MODAL -->
    @if (reviewing) {
      <div class="modal-back" (click)="reviewing = null">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3 class="h-md">Rate {{ reviewing.trail?.name }}</h3>
          <div class="star-pick" role="group" aria-label="Choose a rating from 1 to 5 stars">
            @for (n of [1, 2, 3, 4, 5]; track n) {
              <button
                type="button"
                [class.on]="rating >= n"
                [attr.aria-label]="'Rate ' + n + ' out of 5 stars'"
                [attr.aria-pressed]="rating === n"
                (click)="setRating(n)"
              ><app-icon name="star" /></button>
            }
          </div>
          <p class="star-rating-value" aria-live="polite">{{ rating }} out of 5 stars</p>
          <div class="field">
            <label>Comment (optional)</label>
            <textarea rows="3" [(ngModel)]="comment" placeholder="How was the trail and your guide?"></textarea>
          </div>
          <div class="field">
            <label>Add photos (up to 5)</label>
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple (change)="onReviewPhotosSelected($event)" />
            @if (reviewPhotos.length) {
              <div class="review-photo-previews">
                @for (photo of reviewPhotoPreviews; track $index) {
                  <img class="review-photo-preview" [src]="photo" alt="Review preview" />
                }
              </div>
              <small class="muted">{{ reviewPhotos.length }}/5 photos selected</small>
            }
          </div>
          @if (modalError) {
            <div class="alert alert-error">{{ modalError }}</div>
          }
          <div class="row" style="justify-content:flex-end;gap:8px">
            <button class="btn btn-ghost" (click)="reviewing = null">Close</button>
            <button class="btn btn-primary" [disabled]="saving" (click)="submitReview()">{{ saving ? 'Saving…' : 'Submit review' }}</button>
          </div>
        </div>
      </div>
    }

  `,
})
export class MyBookingsComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private confirmation = inject(ConfirmationService);

  statuses = BOOKING_STATUSES;
  sClass = statusClass;
  bookings: Booking[] = [];
  deletingBookingIds = new Set<number>();
  filter = '';
  loading = true;

  reviewing: Booking | null = null;
  rating = 5;
  comment = '';
  saving = false;
  modalError = '';
  reviewPhotos: File[] = [];
  reviewPhotoPreviews: string[] = [];

  ngOnInit() {
    this.load();
  }

  load() {
    this.api.myBookings().subscribe({
      next: (list) => {
        this.bookings = list;
        this.loading = false;
      },
      error: (e) => {
        this.loading = false;
        this.toast.err(errMsg(e));
      },
    });
  }

  visible() {
    return this.filter ? this.bookings.filter((b) => b.status === this.filter) : this.bookings;
  }
  count(s: string) {
    return this.bookings.filter((b) => b.status === s).length;
  }
  cover(b: Booking) {
    return coverBackground({ name: b.trail?.name, category: b.trail?.category || 'Mountain', image_url: b.trail?.image_url });
  }
  filledStars(n: number): number[] {
    return Array(Math.max(0, Math.min(5, Math.round(n || 0)))).fill(0);
  }

  setRating(rating: number): void {
    this.rating = Math.min(5, Math.max(1, Math.round(rating)));
  }

  async cancel(booking: Booking) {
    const confirmed = await this.confirmation.confirm({
      tone: 'danger',
      title: 'Cancel this booking?',
      message: `Your request for ${booking.trail?.name || 'this trail'} will be cancelled. This action cannot be undone.`,
      detail: `${booking.booking_code} · ${booking.trail?.name || 'Trail booking'} · ${booking.trek_date}`,
      confirmLabel: 'Yes, cancel booking',
      cancelLabel: 'Keep booking',
    });
    if (!confirmed) return;

    this.api.cancelBooking(booking.id).subscribe({
      next: () => {
        this.toast.ok('Booking cancelled.');
        this.load();
      },
      error: (e) => this.toast.err(errMsg(e)),
    });
  }

  async deleteCompletedBooking(booking: Booking) {
    const confirmed = await this.confirmation.confirm({
      tone: 'danger',
      title: 'Delete completed booking history?',
      message: 'This permanently deletes the completed booking, its review, and review photos. This cannot be undone.',
      detail: `${booking.booking_code} · ${booking.trail?.name || 'Trail booking'}`,
      confirmLabel: 'Delete history',
      cancelLabel: 'Keep booking',
    });
    if (!confirmed) return;

    this.deletingBookingIds.add(booking.id);
    this.api.deleteCompletedBooking(booking.id).subscribe({
      next: (response) => {
        this.deletingBookingIds.delete(booking.id);
        this.bookings = this.bookings.filter((item) => item.id !== booking.id);
        this.toast.ok(response.message);
      },
      error: (e) => {
        this.deletingBookingIds.delete(booking.id);
        this.toast.err(errMsg(e));
      },
    });
  }

  openReview(b: Booking) {
    this.reviewing = b;
    this.rating = 5;
    this.comment = '';
    this.modalError = '';
    this.reviewPhotos = [];
    this.reviewPhotoPreviews = [];
  }

  onReviewPhotosSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.reviewPhotos = Array.from(input.files || []).slice(0, 5);
    this.reviewPhotoPreviews = [];
    this.reviewPhotos.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => this.reviewPhotoPreviews.push(String(reader.result || ''));
      reader.readAsDataURL(file);
    });
  }

  submitReview() {
    if (!this.reviewing) return;
    this.saving = true;
    this.modalError = '';
    this.api.reviewBooking(this.reviewing.id, this.rating, this.comment, this.reviewPhotos).subscribe({
      next: () => {
        this.saving = false;
        this.reviewing = null;
        this.toast.ok('Thanks for your review!');
        this.load();
      },
      error: (e) => {
        this.saving = false;
        this.modalError = errMsg(e);
      },
    });
  }
}