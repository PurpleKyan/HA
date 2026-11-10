import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, HostListener, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../api.service';
import { AuthService } from '../auth.service';
import { AppIconComponent } from '../shared/app-icon.component';
import { Booking, Review, Trail, User } from '../models';
import { ToastService } from '../toast.service';
import { API_URL } from '../config';
import { categoryIcon, coverBackground, diffClass, errMsg, todayStr } from '../utils';

@Component({
  selector: 'app-trail-detail',
  standalone: true,
  imports: [FormsModule, RouterLink, CurrencyPipe, DatePipe, DecimalPipe, AppIconComponent],
  template: `
    @if (loading) {
      <section class="container section"><div class="skeleton" style="height:320px"></div></section>
    } @else if (!trail) {
      <section class="container section">
        <div class="empty">
          <app-icon name="hiking" />
          <h3>Trail not found</h3>
          <p class="muted">{{ error || 'It may have been removed or is not verified yet.' }}</p>
          <a routerLink="/trails" class="btn btn-primary">Back to trails</a>
        </div>
      </section>
    } @else {
      <section class="detail-cover" [style.background]="cover()">
        <div class="container">
          <a routerLink="/trails" class="back">← All trails</a>
          <div class="detail-title">
            <div class="row" style="gap:8px;flex-wrap:wrap">
              <span class="badge b-glass"><img class="badge-icon" [src]="icon()" alt="" /> {{ trail.category }}</span>
              <span [class]="'badge ' + diff(trail.difficulty)">{{ trail.difficulty }}</span>
              <span class="badge b-glass">{{ trail.trip_type }}</span>
            </div>
            <section class="trail-photo-gallery" aria-labelledby="trail-gallery-title">
              <h2 id="trail-gallery-title">Photo gallery <span>({{ trail.photos?.length || 0 }})</span></h2>
              @if (trail.photos; as photos) {
                @if (photos.length) {
                @if (galleryPhoto(); as photo) {
                  <div
                    class="trail-gallery-viewer"
                    (touchstart)="galleryTouchStart($event)"
                    (touchend)="galleryTouchEnd($event)"
                  >
                    <button class="trail-gallery-full-image" type="button" [attr.aria-label]="'Open photo viewer for ' + trail.name" aria-haspopup="dialog" (click)="galleryViewerOpen = true">
                      <img [src]="photo.url" [alt]="trail.name + ' photo ' + (galleryPhotoIndex + 1)" />
                    </button>
                    @if (photos.length > 1) {
                      <button class="trail-gallery-nav trail-gallery-prev" type="button" aria-label="Previous photo" (click)="previousGalleryPhoto()">‹</button>
                      <button class="trail-gallery-nav trail-gallery-next" type="button" aria-label="Next photo" (click)="nextGalleryPhoto()">›</button>
                      <span class="trail-gallery-count">{{ galleryPhotoIndex + 1 }} / {{ photos.length }}</span>
                    }
                  </div>
                  @if (photos.length > 1) {
                    <nav class="trail-gallery-thumbnails" aria-label="Choose a gallery photo">
                      @for (item of photos; track item.id; let i = $index) {
                        <button
                          type="button"
                          [class.active]="i === galleryPhotoIndex"
                          [attr.aria-label]="'Show photo ' + (i + 1)"
                          [attr.aria-current]="i === galleryPhotoIndex ? 'true' : null"
                          (click)="galleryPhotoIndex = i"
                        >
                          <img [src]="item.url" [alt]="trail.name + ' thumbnail ' + (i + 1)" loading="lazy" />
                        </button>
                      }
                    </nav>
                  }
                }
                } @else {
                  <p class="trail-gallery-empty">No photos have been added to this trail yet.</p>
                }
              } @else {
                <p class="trail-gallery-empty">No photos have been added to this trail yet.</p>
              }
            </section>
            <h1>{{ trail.name }}</h1>
            <p><app-icon name="location" /> {{ trail.location }}
              @if (trail.reviews_count > 0) {
                &nbsp;·&nbsp; @for (_ of filledStars(trail.avg_rating); track $index) { <app-icon name="star" /> } {{ trail.avg_rating | number: '1.1-1' }} ({{ trail.reviews_count }})
              }
            </p>
          </div>
        </div>
      </section>

      @if (galleryViewerOpen) {
        @if (galleryPhoto(); as photo) {
          <div class="trail-lightbox-backdrop" role="presentation" (click)="closeGalleryViewer()">
            <section
              class="trail-lightbox"
              role="dialog"
              aria-modal="true"
              aria-label="Trail photo viewer"
              (click)="$event.stopPropagation()"
              (touchstart)="galleryTouchStart($event)"
              (touchend)="galleryTouchEnd($event)"
            >
              <header class="trail-lightbox-header">
                <span>{{ trail.name }} · {{ galleryPhotoIndex + 1 }} / {{ trail.photos?.length || 0 }}</span>
                <button class="trail-lightbox-done" type="button" (click)="closeGalleryViewer()">Done <span aria-hidden="true">×</span></button>
              </header>
              <div class="trail-lightbox-stage">
                @if ((trail.photos?.length || 0) > 1) {
                  <button class="trail-lightbox-nav trail-lightbox-prev" type="button" aria-label="Previous photo" (click)="previousGalleryPhoto()">‹</button>
                }
                <img [src]="photo.url" [alt]="trail.name + ' photo ' + (galleryPhotoIndex + 1)" />
                @if ((trail.photos?.length || 0) > 1) {
                  <button class="trail-lightbox-nav trail-lightbox-next" type="button" aria-label="Next photo" (click)="nextGalleryPhoto()">›</button>
                }
              </div>
              @if ((trail.photos?.length || 0) > 1) {
                <nav class="trail-lightbox-thumbnails" aria-label="Choose a gallery photo">
                  @for (item of trail.photos; track item.id; let i = $index) {
                    <button
                      type="button"
                      [class.active]="i === galleryPhotoIndex"
                      [attr.aria-label]="'Show photo ' + (i + 1)"
                      [attr.aria-current]="i === galleryPhotoIndex ? 'true' : null"
                      (click)="galleryPhotoIndex = i"
                    >
                      <img [src]="item.url" [alt]="trail.name + ' thumbnail ' + (i + 1)" />
                    </button>
                  }
                </nav>
              }
            </section>
          </div>
        }
      }

      <section class="container section tight detail-grid">
        <!-- LEFT -->
        <div class="detail-main">
          <div class="stat-grid">
            <div class="stat"><span class="stat-ico"><app-icon name="distance" /></span><div><b>{{ trail.distance_km | number: '1.0-1' }} km</b><small>Distance</small></div></div>
            <div class="stat"><span class="stat-ico"><app-icon name="timer" /></span><div><b>{{ trail.duration_hours | number: '1.0-1' }} h</b><small>Est. duration</small></div></div>
            <div class="stat"><span class="stat-ico"><app-icon name="elevation" /></span><div><b>{{ trail.elevation | number: '1.0-0' }} m</b><small>Elevation</small></div></div>
            <div class="stat"><span class="stat-ico"><app-icon name="group" /></span><div><b>{{ trail.max_daily_visitors }}</b><small>Max visitors / day</small></div></div>
          </div>

          <div class="card card-pad block">
            <h3 class="h-sm">About this trail</h3>
            <p class="prose">{{ trail.description }}</p>
            @if (trail.features && trail.features.length) {
              <div class="chips">
                @for (f of trail.features; track f) {
                  <span class="chip static">{{ f }}</span>
                }
              </div>
            }
          </div>

          <div class="card card-pad block">
            <h3 class="h-sm">Fees</h3>
            <div class="fee-row"><span>Entrance fee</span><b>{{ trail.entrance_fee | currency: 'PHP' : 'symbol' : '1.0-0' }} / hiker</b></div>
            <div class="fee-row"><span>Guide fee</span><b>{{ trail.guide_fee | currency: 'PHP' : 'symbol' : '1.0-0' }} / group</b></div>
            <p class="muted small">No online payment. Fees are settled directly with the guide or tourism office.</p>
          </div>

          <section class="permit-card block" aria-labelledby="permit-title">
            <h3 id="permit-title" class="permit-heading">
              <span class="permit-document" aria-hidden="true">▤</span>
              Permits Required
            </h3>
            @if (permitRequirements().length) {
              <ul class="permit-list">
                @for (permit of permitRequirements(); track permit) {
                  <li><span class="permit-check" aria-hidden="true">✓</span> {{ permit }}</li>
                }
              </ul>
            } @else {
              <p class="permit-details">No permit requirements have been recorded for this trail.</p>
            }
          </section>

          <div class="grid grid-2 block">
            <div class="card card-pad warn">
              <h3 class="h-sm"><app-icon name="warning" /> Safety advisory</h3>
              <p class="prose">{{ trail.safety_advisory || 'Hike with an accredited guide, check the weather, and bring water and a first-aid kit.' }}</p>
            </div>
            <div class="card card-pad lnt">
              <h3 class="h-sm"><app-icon name="leaf" /> Leave No Trace</h3>
              <p class="prose">{{ trail.lnt_notes || 'Pack out your trash, stay on the trail and respect wildlife and local communities.' }}</p>
            </div>
          </div>

          @if (mapUrl) {
            <div class="card card-pad block">
              <div class="row between" style="margin-bottom:10px">
                <h3 class="h-sm" style="margin:0">Location</h3>
                <a class="btn btn-ghost btn-sm" [href]="directions" target="_blank" rel="noopener">Get directions ↗</a>
              </div>
              <iframe class="map" [src]="mapUrl" title="Trail map" loading="lazy"></iframe>
            </div>
          }

          <div class="card card-pad block">
            <h3 class="h-sm">Hiker reviews</h3>
            @for (r of reviews; track r.id) {
              <div class="review">
                <div class="row between">
                  <b>{{ r.user?.name || 'Hiker' }}</b>
                  @for (_ of filledStars(r.rating); track $index) { <app-icon name="star" /> }
                </div>
                <p>{{ r.comment || 'No comment.' }}</p>
                @if (reviewPhotos(r).length) {
                  <div class="review-gallery">
                    <img
                      [src]="reviewPhotoUrl(reviewPhotos(r), reviewPhotoIndex(r.id))"
                      alt="Photo uploaded by {{ r.user?.name || 'Hiker' }}"
                    />
                    @if (reviewPhotos(r).length > 1) {
                      <button
                        type="button"
                        class="review-gallery-nav review-gallery-prev"
                        (click)="previousReviewPhoto(r.id, reviewPhotos(r).length)"
                        aria-label="Previous review photo"
                      >‹</button>
                      <button
                        type="button"
                        class="review-gallery-nav review-gallery-next"
                        (click)="nextReviewPhoto(r.id, reviewPhotos(r).length)"
                        aria-label="Next review photo"
                      >›</button>
                      <span class="review-gallery-count">
                        {{ reviewPhotoIndex(r.id) + 1 }} / {{ reviewPhotos(r).length }}
                      </span>
                    }
                  </div>
                }
                <small class="muted">{{ r.created_at | date: 'mediumDate' }}</small>
              </div>
            } @empty {
              <p class="muted">No reviews yet. Only hikers with a completed trek can leave a review.</p>
            }
          </div>
        </div>

        <!-- RIGHT: BOOKING -->
        <aside class="detail-side">
          <div class="card card-pad book-card">
            @if (success) {
              <div class="center">
                <span class="booking-success-icon"><app-icon name="success" /></span>
                <h3 class="h-sm">Request sent!</h3>
                <p class="muted">Your booking ID</p>
                <div class="code">{{ success.booking_code }}</div>
                <p class="muted small">Status: <span class="badge b-amber">Pending</span><br />The guide will approve or decline your request.</p>
                <a routerLink="/my-bookings" class="btn btn-primary btn-block">Track my bookings</a>
                <button class="btn btn-ghost btn-block" style="margin-top:8px" (click)="success = null">Book another date</button>
              </div>
            } @else {
              <h3 class="h-sm">Request a booking</h3>
              <p class="price-big">{{ trail.entrance_fee | currency: 'PHP' : 'symbol' : '1.0-0' }}<small> / hiker + {{ trail.guide_fee | currency: 'PHP' : 'symbol' : '1.0-0' }} guide</small></p>

              @if (!auth.isLoggedIn()) {
                <p class="muted">Log in as a hiker to send a reservation request.</p>
                <a routerLink="/login" [queryParams]="{ role: 'hiker' }" class="btn btn-primary btn-block">Log in to book</a>
                <a routerLink="/register" class="btn btn-ghost btn-block" style="margin-top:8px">Create account</a>
              } @else if (auth.role() !== 'hiker') {
                <div class="alert">Only hiker accounts can send booking requests.</div>
              } @else {
                <form (ngSubmit)="book()">
                  <div class="field">
                    <label>Choose a guide</label>
                    <select name="guide" [(ngModel)]="guideId" required>
                      <option [ngValue]="null" disabled>Select a guide</option>
                      @for (guide of guides; track guide.id; let rank = $index) {
                        <option [ngValue]="guide.id">
                          {{ rank + 1 }}. {{ guide.name }} ·
                          {{ guide.completed_bookings || 0 }} completed booking(s) ·
                          {{ guide.avg_rating ? (guide.avg_rating | number: '1.1-1') + '★' : 'New guide' }}
                          {{ guide.review_count ? '(' + guide.review_count + ' reviews)' : '' }}
                        </option>
                      }
                    </select>
                    @if (!guides.length) {
                      <small class="muted">No guides are currently available.</small>
                    }
                  </div>
                  <div class="field">
                    <label>Trek date</label>
                    <input type="date" name="date" [(ngModel)]="date" [min]="minDate" required />
                  </div>
                  <div class="field">
                    <label>Group size (max 60)</label>
                    <div class="group-size-stepper" aria-label="Group size">
                      <button type="button" class="group-size-button" aria-label="Decrease group size" [disabled]="group <= 1" (pointerdown)="startGroupAdjustment($event, -1)" (pointerup)="stopGroupAdjustment()" (pointerleave)="stopGroupAdjustment()" (pointercancel)="stopGroupAdjustment()" (click)="onGroupButtonClick(-1)">−</button>
                      <output class="group-size-value" aria-live="polite">{{ group }}</output>
                      <button type="button" class="group-size-button" aria-label="Increase group size" [disabled]="group >= maxGroupSize()" (pointerdown)="startGroupAdjustment($event, 1)" (pointerup)="stopGroupAdjustment()" (pointerleave)="stopGroupAdjustment()" (pointercancel)="stopGroupAdjustment()" (click)="onGroupButtonClick(1)">+</button>
                    </div>
                  </div>
                  <div class="field">
                    <label>Itinerary / notes</label>
                    <textarea name="itinerary" rows="2" [(ngModel)]="itinerary" placeholder="Meeting point, start time, route…"></textarea>
                  </div>
                  <div class="field">
                    <label>Special requirements</label>
                    <textarea name="special" rows="2" [(ngModel)]="special" placeholder="Allergies, mobility needs, equipment…"></textarea>
                  </div>

                  <div class="total">
                    <span>Estimated total</span>
                    <b>{{ total() | currency: 'PHP' : 'symbol' : '1.0-0' }}</b>
                  </div>

                  @if (formError) {
                    <div class="alert alert-error">{{ formError }}</div>
                  }
                  <button class="btn btn-accent btn-block" type="submit" [disabled]="submitting">
                    {{ submitting ? 'Sending…' : 'Send request' }}
                  </button>
                </form>
              }
            }
          </div>
        </aside>
      </section>

      @if (spamNotice) {
        <div class="modal-back spam-notice-back" role="presentation" (click)="dismissSpamNotice()">
          <section class="modal spam-notice" role="dialog" aria-modal="true" aria-labelledby="spam-notice-title" (click)="$event.stopPropagation()">
            <button class="spam-notice-close" type="button" aria-label="Close notice" (click)="dismissSpamNotice()">×</button>
            <div [class]="'spam-notice-icon ' + (spamNotice.restricted ? 'restricted' : '')">
              <app-icon name="warning" />
            </div>
            <p class="spam-notice-label">{{ spamNotice.restricted ? 'TEMPORARY PAUSE' : 'REPEAT REQUEST' }}</p>
            <h2 id="spam-notice-title">{{ spamNotice.restricted ? 'Booking requests paused' : 'Please slow down' }}</h2>
            <p class="spam-notice-message">{{ spamNotice.message }}</p>
            @if (spamNotice.restrictedUntil) {
              <div class="spam-notice-until">
                You can try again <strong>{{ spamNotice.restrictedUntil | date: 'short' }}</strong>
              </div>
            }
            <button class="btn btn-primary btn-block" type="button" (click)="dismissSpamNotice()">Got it</button>
          </section>
        </div>
      }
    }
  `,
})
export class TrailDetailComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);
  private toast = inject(ToastService);
  auth = inject(AuthService);

  trail: Trail | null = null;
  galleryPhotoIndex = 0;
  private galleryTouchStartX: number | null = null;
  reviews: Review[] = [];
  reviewPhotoIndexes: Record<number, number> = {};
  loading = true;
  error = '';
  mapUrl: SafeResourceUrl | null = null;
  directions = '';

  guides: User[] = [];
  guideId: number | null = null;
  minDate = todayStr();
  date = '';
  group = 2;
  itinerary = '';
  special = '';
  submitting = false;
  formError = '';
  success: Booking | null = null;
  spamNotice: { message: string; restricted: boolean; restrictedUntil: string | null } | null = null;
  galleryViewerOpen = false;
  private groupAdjustDelay: ReturnType<typeof setTimeout> | null = null;
  private groupAdjustInterval: ReturnType<typeof setInterval> | null = null;
  private suppressGroupClick = false;

  diff = diffClass;

  ngOnInit() {
    this.route.paramMap.subscribe((p) => this.load(Number(p.get('id'))));
  }

  private load(id: number) {
    this.loading = true;
    this.trail = null;
    this.success = null;
    this.galleryPhotoIndex = 0;
    this.galleryViewerOpen = false;
    this.api.trail(id).subscribe({
      next: (t) => {
        this.trail = t;
        this.loading = false;
        this.buildMap(t);
        this.api.guides().subscribe({
          next: (guides) => {
            this.guides = guides;
            this.guideId = guides[0]?.id ?? null;
          },
          error: () => { this.guides = []; this.guideId = null; },
        });
        this.api.trailReviews(id).subscribe({ next: (r) => (this.reviews = r), error: () => {} });
      },
      error: (e) => {
        this.error = e.status === 404 ? '' : errMsg(e);
        this.loading = false;
      },
    });
  }

  private buildMap(t: Trail) {
    this.mapUrl = null;
    const lat = t.latitude;
    const lon = t.longitude;
    if (lat !== null && lat !== undefined && lon !== null && lon !== undefined) {
      const bbox = [lon - 0.04, lat - 0.025, lon + 0.04, lat + 0.025].join('%2C');
      this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lon}`
      );
      this.directions = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
    }
  }

  cover() {
    return this.trail ? coverBackground(this.trail) : '';
  }
  icon() {
    return this.trail ? categoryIcon(this.trail.category) : '';
  }
  filledStars(n: number): number[] {
    return Array(Math.max(0, Math.min(5, Math.round(n || 0)))).fill(0);
  }

  permitRequirements(): string[] {
    return (this.trail?.permits || '')
      .split(/[;\n]+/)
      .map((permit) => permit.trim())
      .filter(Boolean);
  }

  galleryPhoto() {
    const photos = this.trail?.photos || [];
    if (!photos.length) return null;
    this.galleryPhotoIndex = Math.min(this.galleryPhotoIndex, photos.length - 1);
    return photos[this.galleryPhotoIndex];
  }

  previousGalleryPhoto() {
    const photoCount = this.trail?.photos?.length || 0;
    if (photoCount > 1) this.galleryPhotoIndex = (this.galleryPhotoIndex - 1 + photoCount) % photoCount;
  }

  nextGalleryPhoto() {
    const photoCount = this.trail?.photos?.length || 0;
    if (photoCount > 1) this.galleryPhotoIndex = (this.galleryPhotoIndex + 1) % photoCount;
  }

  closeGalleryViewer() {
    this.galleryViewerOpen = false;
  }

  dismissSpamNotice() {
    this.spamNotice = null;
  }

  @HostListener('document:keydown', ['$event'])
  handleGalleryViewerKeydown(event: KeyboardEvent) {
    if (this.spamNotice && event.key === 'Escape') {
      this.dismissSpamNotice();
      return;
    }

    if (!this.galleryViewerOpen) return;

    if (event.key === 'Escape') {
      this.closeGalleryViewer();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.previousGalleryPhoto();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.nextGalleryPhoto();
    }
  }

  galleryTouchStart(event: TouchEvent) {
    this.galleryTouchStartX = event.changedTouches[0]?.clientX ?? null;
  }

  galleryTouchEnd(event: TouchEvent) {
    const startX = this.galleryTouchStartX;
    this.galleryTouchStartX = null;
    const endX = event.changedTouches[0]?.clientX;
    if (startX === null || endX === undefined) return;

    const distance = endX - startX;
    if (Math.abs(distance) < 40) return;

    if (distance > 0) this.previousGalleryPhoto();
    else this.nextGalleryPhoto();
  }

  reviewPhotos(review: Review): string[] {
    return Array.isArray(review.photos) ? review.photos.filter((photo) => typeof photo === 'string' && photo.length > 0) : [];
  }

  reviewPhotoIndex(reviewId: number): number {
    const index = this.reviewPhotoIndexes[reviewId] ?? 0;
    return Number.isInteger(index) && index >= 0 ? index : 0;
  }

  reviewPhotoUrl(photos: string[], index: number): string {
    const safeIndex = photos.length ? Math.min(Math.max(index, 0), photos.length - 1) : 0;
    const photo = photos[safeIndex];
    if (!photo) return '';
    if (/^https?:\/\//i.test(photo)) return photo;
    if (photo.startsWith('/')) {
      return `${API_URL.replace(/\/api$/, '')}${photo}`;
    }
    return `${API_URL.replace(/\/api$/, '')}/${photo}`;
  }

  previousReviewPhoto(reviewId: number, photoCount: number): void {
    const current = this.reviewPhotoIndex(reviewId);
    this.reviewPhotoIndexes[reviewId] = (current - 1 + photoCount) % photoCount;
  }

  nextReviewPhoto(reviewId: number, photoCount: number): void {
    const current = this.reviewPhotoIndex(reviewId);
    this.reviewPhotoIndexes[reviewId] = (current + 1) % photoCount;
  }

  total(): number {
    if (!this.trail) return 0;
    const g = Number(this.group) || 0;
    return this.trail.entrance_fee * g + this.trail.guide_fee;
  }

  maxGroupSize(): number {
    return Math.min(60, this.trail?.max_daily_visitors ?? 60);
  }

  adjustGroup(amount: number): void {
    this.group = Math.max(1, Math.min(this.maxGroupSize(), this.group + amount));
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

  book() {
    if (!this.trail) return;
    this.formError = '';
    const g = Number(this.group);
    if (!this.guideId) {
      this.formError = 'Please choose a guide.';
      return;
    }
    if (!this.date) {
      this.formError = 'Please choose your trek date.';
      return;
    }
    if (!Number.isInteger(g) || g < 1 || g > 60) {
      this.formError = 'Group size must be a whole number from 1 to 60.';
      return;
    }
    if (g > this.trail.max_daily_visitors) {
      this.formError = `Group size cannot exceed the daily limit of ${this.trail.max_daily_visitors}.`;
      return;
    }

    this.submitting = true;
    this.api
      .createBooking({
        trail_id: this.trail.id,
        guide_id: this.guideId,
        trek_date: this.date,
        group_size: g,
        itinerary: this.itinerary,
        special_requirements: this.special,
      })
      .subscribe({
        next: (b) => {
          this.submitting = false;
          this.success = b;
          this.toast.ok('Booking request sent!');
        },
        error: (e) => {
          this.submitting = false;
          if (e.status === 429) {
            this.formError = '';
            this.spamNotice = {
              message: e.error?.message || errMsg(e),
              restricted: e.error?.restricted === true,
              restrictedUntil: e.error?.restricted_until || null,
            };
            return;
          }
          this.formError = errMsg(e);
        },
      });
  }
}