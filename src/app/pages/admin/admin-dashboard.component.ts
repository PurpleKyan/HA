import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../api.service';
import { ConfirmationService } from '../../confirmation.service';
import { AdminStats, Booking, CATEGORIES, Report, Review, Trail, User } from '../../models';
import { AppIconComponent } from '../../shared/app-icon.component';
import { ReportViewComponent } from '../../shared/report-view.component';
import { ToastService } from '../../toast.service';
import { errMsg, statusClass } from '../../utils';
import { API_URL } from '../../config';

type Tab = 'overview' | 'trails' | 'users' | 'reviews' | 'bookings';
type UserFilter = 'all' | 'hiker' | 'guide' | 'admin';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, DatePipe, AppIconComponent, ReportViewComponent],
  template: `
    <section class="page-head">
      <div class="container">
        <h1 class="h-xl">Administrator dashboard</h1>
        <p>Verify trail listings, manage user accounts and monitor platform activity.</p>
      </div>
    </section>

    <section class="container section tight">
      <div class="tabs">
        <button class="tab" [class.active]="tab === 'overview'" (click)="tab = 'overview'"><app-icon name="dashboard" /> Overview</button>
        <button class="tab" [class.active]="tab === 'trails'" (click)="tab = 'trails'">
          <app-icon name="verified" /> Trail verification @if (stats && stats.trails.pending > 0) { <span class="count">{{ stats.trails.pending }}</span> }
        </button>
        <button class="tab" [class.active]="tab === 'users'" (click)="tab = 'users'; loadUsers()"><app-icon name="users" /> Users ({{ users.length }})</button>
        <button class="tab" [class.active]="tab === 'reviews'" (click)="tab = 'reviews'; loadReviews()"><app-icon name="star" /> Reviews ({{ reviews.length }})</button>
        <button class="tab" [class.active]="tab === 'bookings'" (click)="tab = 'bookings'"><app-icon name="booking" /> All bookings ({{ bookings.length }})</button>
      </div>

      <!-- OVERVIEW -->
      @if (tab === 'overview') {
        @if (stats) {
          <div class="stat-grid">
            <div class="stat"><span class="stat-ico"><app-icon name="hiking" /></span><div><b>{{ stats.users.hikers }}</b><small>Hikers</small></div></div>
            <div class="stat"><span class="stat-ico"><app-icon name="users" /></span><div><b>{{ stats.users.guides }}</b><small>Guides / officers</small></div></div>
            <div class="stat"><span class="stat-ico"><app-icon name="verified" /></span><div><b>{{ stats.trails.verified }}</b><small>Verified trails</small></div></div>
            <div class="stat"><span class="stat-ico"><app-icon name="clock" /></span><div><b>{{ stats.trails.pending }}</b><small>Trails awaiting review</small></div></div>
          </div>
        }
        <h3 class="h-sm" style="margin:24px 0 12px">Visitor volume &amp; booking summary</h3>
        <app-report-view [report]="report" />
      }

      <!-- TRAIL VERIFICATION -->
      @if (tab === 'trails') {
        <div class="row between" style="gap:10px;margin-bottom:14px;flex-wrap:wrap">
          <div class="row" style="gap:10px;flex-wrap:wrap">
            @for (s of trailFilters; track s.key) {
              <button class="chip" [class.on]="trailFilter === s.key" (click)="trailFilter = s.key; loadTrails()">{{ s.label }}</button>
            }
          </div>
          <button class="btn btn-primary btn-sm" type="button" (click)="showCreateTrail = !showCreateTrail">
            {{ showCreateTrail ? 'Cancel' : '+ Add new place' }}
          </button>
        </div>

        @if (showCreateTrail) {
          <form class="card card-pad admin-trail-edit" style="margin-bottom:14px" (ngSubmit)="createTrail()">
            <div class="row between"><h3>Add a new place</h3></div>
            <div class="form-grid">
              <label>Name<input [(ngModel)]="newTrail.name" name="new_name" required /></label>
              <label>Location<input [(ngModel)]="newTrail.location" name="new_location" required /></label>
              <label>Assigned guide<select [(ngModel)]="newTrail.user_id" name="new_user_id" required>
                <option [ngValue]="null" disabled>Select guide</option>
                @for (guide of guideUsers; track guide.id) { <option [ngValue]="guide.id">{{ guide.name }}</option> }
              </select></label>
              <label>Category<select [(ngModel)]="newTrail.category" name="new_category">@for (category of categories; track category) { <option [value]="category">{{ category }}</option> }</select></label>
              <label>Difficulty<select [(ngModel)]="newTrail.difficulty" name="new_difficulty"><option>Easy</option><option>Moderate</option><option>Hard</option></select></label>
              <label>Trip type<select [(ngModel)]="newTrail.trip_type" name="new_trip_type"><option>Day Hike</option><option>Overnight</option></select></label>
              <label>Photo URL<input [(ngModel)]="newTrail.image_url" name="new_image_url" type="url" placeholder="https://..." /></label>
              <label>Entrance fee (PHP)<input [(ngModel)]="newTrail.entrance_fee" name="new_entrance_fee" type="number" min="0" required /></label>
              <label>Guide fee (PHP)<input [(ngModel)]="newTrail.guide_fee" name="new_guide_fee" type="number" min="0" required /></label>
              <label>Elevation (m)<input [(ngModel)]="newTrail.elevation" name="new_elevation" type="number" min="0" required /></label>
              <label>Distance (km)<input [(ngModel)]="newTrail.distance_km" name="new_distance_km" type="number" min="0" step="0.1" required /></label>
              <label>Duration (hours)<input [(ngModel)]="newTrail.duration_hours" name="new_duration_hours" type="number" min="0" step="0.1" required /></label>
              <label>Max visitors/day<input [(ngModel)]="newTrail.max_daily_visitors" name="new_max_visitors" type="number" min="1" required /></label>
              <label>Latitude<input [(ngModel)]="newTrail.latitude" name="new_latitude" type="number" step="any" /></label>
              <label>Longitude<input [(ngModel)]="newTrail.longitude" name="new_longitude" type="number" step="any" /></label>
              <label style="grid-column:1/-1">Description<textarea [(ngModel)]="newTrail.description" name="new_description" rows="3" required></textarea></label>
              <label style="grid-column:1/-1">Permits<textarea [(ngModel)]="newTrail.permits" name="new_permits" rows="2"></textarea></label>
              <label>Features<input [(ngModel)]="newTrail.featuresText" name="new_features" placeholder="Scenic View, Camping" /></label>
              <label style="grid-column:1/-1">Safety advisory<textarea [(ngModel)]="newTrail.safety_advisory" name="new_safety" rows="2"></textarea></label>
              <label style="grid-column:1/-1">Leave No Trace notes<textarea [(ngModel)]="newTrail.lnt_notes" name="new_lnt" rows="2"></textarea></label>
            </div>
            @if (newTrail.image_url) { <img class="admin-trail-preview" [src]="newTrail.image_url" alt="New place preview" /> }
            <button class="btn btn-primary" type="submit" [disabled]="creatingTrail || !guideUsers.length">{{ creatingTrail ? 'Adding…' : 'Add place' }}</button>
          </form>
        }
        <div class="card table-wrap">
          <table class="tbl">
            <thead><tr><th>Trail</th><th>Owner</th><th>Details</th><th>Status</th><th></th></tr></thead>
            <tbody>
              @for (t of trails; track t.id) {
                <tr>
                  <td><b>{{ t.name }}</b><br /><small class="muted">{{ t.location }} · {{ t.category }}</small></td>
                  <td>{{ t.owner?.name }}<br /><small class="muted">{{ t.owner?.email }}</small></td>
                  <td class="small">
                    {{ t.difficulty }} · {{ t.trip_type }}<br />
                    {{ t.entrance_fee | currency: 'PHP' : 'symbol' : '1.0-0' }} + {{ t.guide_fee | currency: 'PHP' : 'symbol' : '1.0-0' }}<br />
                    Limit {{ t.max_daily_visitors }}/day
                  </td>
                  <td><span [class]="'badge ' + sClass(t.status)">{{ t.status }}</span></td>
                  <td class="actions">
                    <button class="btn btn-ghost btn-sm" (click)="openTrailEdit(t)">{{ editingTrail?.id === t.id ? 'Cancel' : 'Edit' }}</button>
                    <button class="btn btn-primary btn-sm" type="button" (click)="openTrailGallery(t)">
                      Photo gallery ({{ t.photos?.length || 0 }})
                    </button>
                    @if (t.status !== 'verified') {
                      <button class="btn btn-success btn-sm" (click)="verify(t, 'verified')">Verify</button>
                    }
                    @if (t.status !== 'rejected') {
                      <button class="btn btn-ghost btn-sm danger-text" (click)="verify(t, 'rejected')">Reject</button>
                    }
                    <button
                      class="btn btn-ghost btn-sm"
                      [class.danger-text]="t.is_active"
                      (click)="toggleTrailVisibility(t)"
                    >{{ t.is_active ? 'Hide' : 'Show' }}</button>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="center muted" style="padding:28px">No trails in this list.</td></tr>
              }
              @if (editingTrail) {
                <tr>
                  <td colspan="5">
                    <form class="admin-trail-edit" (ngSubmit)="saveTrailEdit()">
                      <div class="row between"><h3>Edit {{ editingTrail.name }}</h3><button type="button" class="btn btn-ghost btn-sm" (click)="closeTrailEdit()">Cancel</button></div>
                      <div class="form-grid">
                        <label>Place name<input [(ngModel)]="trailEdit.name" name="trail_name" required /></label>
                        <label>Location<input [(ngModel)]="trailEdit.location" name="location" required /></label>
                        <label>Latitude<input [(ngModel)]="trailEdit.latitude" name="latitude" type="number" step="any" /></label>
                        <label>Longitude<input [(ngModel)]="trailEdit.longitude" name="longitude" type="number" step="any" /></label>
                        <label>Entrance fee (PHP)<input [(ngModel)]="trailEdit.entrance_fee" name="entrance_fee" type="number" min="0" required /></label>
                        <label>Guide fee (PHP)<input [(ngModel)]="trailEdit.guide_fee" name="guide_fee" type="number" min="0" required /></label>
                      </div>
                      <button class="btn btn-primary" type="submit" [disabled]="savingTrail">{{ savingTrail ? 'Saving…' : 'Save changes' }}</button>
                    </form>
                  </td>
                </tr>
              }
              @if (galleryTrail) {
                <tr>
                  <td colspan="5">
                    <section id="trail-gallery-editor" class="admin-trail-gallery" aria-label="Manage trail photos">
                      <div class="row between" style="gap:10px;flex-wrap:wrap">
                        <h3>Photos for {{ galleryTrail.name }}</h3>
                        <button class="btn btn-ghost btn-sm" type="button" (click)="closeTrailGallery()">Done</button>
                      </div>
                      <div class="form-grid">
                        <label>Cover photo URL<input [ngModel]="galleryImageUrl" (ngModelChange)="galleryImageUrl = $event" [ngModelOptions]="{standalone: true}" type="url" placeholder="https://..." /></label>
                        <label>Upload cover photo<input type="file" accept="image/jpeg,image/png,image/webp" (change)="onPictureSelected($event)" /></label>
                      </div>
                      @if (picturePreview || galleryImageUrl) { <img class="admin-trail-preview" [src]="picturePreview || galleryImageUrl" alt="Trail cover preview" /> }
                      <div class="row" style="gap:10px;flex-wrap:wrap">
                        @if (selectedPicture) {
                          <button class="btn btn-primary btn-sm" type="button" (click)="uploadTrailPicture()" [disabled]="uploadingPicture">
                            {{ uploadingPicture ? 'Uploading…' : 'Upload cover photo' }}
                          </button>
                        }
                        @if (galleryImageUrl !== (galleryTrail.image_url || null)) {
                          <button class="btn btn-ghost btn-sm" type="button" (click)="saveGalleryImageUrl()" [disabled]="savingGalleryImageUrl">
                            {{ savingGalleryImageUrl ? 'Saving…' : 'Save cover photo URL' }}
                          </button>
                        }
                      </div>
                      <div class="row between" style="gap:10px;flex-wrap:wrap">
                        <h4>Photo gallery ({{ galleryTrail.photos?.length || 0 }})</h4>
                        <div>
                          <input id="trail-gallery-photos" type="file" accept="image/jpeg,image/png,image/webp" multiple hidden (change)="onGalleryPhotosSelected($event)" />
                          <button class="btn btn-primary btn-sm" type="button" (click)="openGalleryPhotoPicker()">
                            {{ selectedGalleryPhotos.length ? 'Choose different photos' : '+ Add photos' }}
                          </button>
                        </div>
                      </div>
                      <small class="muted">Select up to 10 JPG, PNG, or WebP images to add them to this trail’s gallery.</small>
                      @if (galleryTrail.photos?.length) {
                        <div class="admin-gallery-grid">
                          @for (photo of galleryTrail.photos; track photo.id) {
                            <div class="admin-gallery-photo">
                              <img [src]="photo.url" [alt]="galleryTrail.name + ' gallery photo'" />
                              <button class="btn btn-ghost btn-sm danger-text" type="button" (click)="deleteGalleryPhoto(photo.id)" [disabled]="deletingGalleryPhotoId === photo.id">
                                {{ deletingGalleryPhotoId === photo.id ? 'Deleting…' : 'Remove photo' }}
                              </button>
                            </div>
                          }
                        </div>
                      }
                      @if (selectedGalleryPhotos.length) {
                        <button class="btn btn-primary btn-sm" type="button" (click)="uploadGalleryPhotos()" [disabled]="uploadingGalleryPhotos">
                          {{ uploadingGalleryPhotos ? 'Uploading…' : 'Upload ' + selectedGalleryPhotos.length + ' photo(s)' }}
                        </button>
                      }
                    </section>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- USERS -->
      @if (tab === 'users') {
        <div class="row between" style="gap:10px;margin-bottom:14px;flex-wrap:wrap">
          <div class="tabs">
            <button class="tab" [class.active]="userFilter === 'all'" (click)="userFilter = 'all'">All ({{ users.length }})</button>
            <button class="tab" [class.active]="userFilter === 'hiker'" (click)="userFilter = 'hiker'">Hikers ({{ countUsers('hiker') }})</button>
            <button class="tab" [class.active]="userFilter === 'guide'" (click)="userFilter = 'guide'">Guides ({{ countUsers('guide') }})</button>
            <button class="tab" [class.active]="userFilter === 'admin'" (click)="userFilter = 'admin'">Admins ({{ countUsers('admin') }})</button>
          </div>
          <button class="btn btn-ghost btn-sm" type="button" (click)="loadUsers()">Refresh users</button>
        </div>
        @if (flaggedUsers.length > 0) {
          <div class="card table-wrap spam-review">
            <h3>Anti-spam review</h3>
            <table class="tbl">
              <thead><tr><th>User</th><th>Role</th><th>Violations</th><th>Restriction ends</th><th>Status</th><th></th></tr></thead>
              <tbody>
                @for (u of flaggedUsers; track u.id) {
                  <tr>
                    <td><b>{{ u.name }}</b><br /><small class="muted">{{ u.email }}</small></td>
                    <td><span class="badge b-gray">{{ u.role }}</span></td>
                    <td>{{ u.spam_violation_count || 0 }}</td>
                    <td>{{ u.spam_validation_status === 'flagged' ? 'Until cleared by admin' : (u.spam_restriction_expires_at ? (u.spam_restriction_expires_at | date: 'short') : 'Pending review') }}</td>
                    <td><span [class]="'badge ' + (u.spam_validation_status === 'flagged' ? 'b-red' : 'b-amber')">{{ u.spam_validation_status }}</span></td>
                    <td class="actions">
                      @if (u.spam_validation_status !== 'flagged') {
                        <button class="btn btn-ghost btn-sm danger-text" (click)="declareSpam(u)">Declare spam</button>
                      }
                      <button class="btn btn-success btn-sm" (click)="clearSpam(u)">Clear restriction</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
        <div class="card table-wrap">
          <table class="tbl">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Phone</th><th>Status</th><th>Qualification proof</th><th></th></tr></thead>
            <tbody>
              @for (u of filteredUsers; track u.id) {
                <tr>
                  <td><b>{{ u.name }}</b></td>
                  <td>{{ u.email }}</td>
                  <td><span class="badge b-gray">{{ u.role }}</span></td>
                  <td>{{ u.phone || '—' }}</td>
                  <td>
                    @if (u.role === 'guide') {
                      <span [class]="'badge ' + (u.account_status === 'approved' ? 'b-green' : u.account_status === 'rejected' ? 'b-red' : 'b-amber')">
                        {{ u.account_status === 'approved' ? 'Approved' : u.account_status === 'rejected' ? 'Rejected' : 'Pending approval' }}
                      </span>
                    } @else {
                      <span [class]="'badge ' + (u.is_active ? 'b-green' : 'b-red')">{{ u.is_active ? 'Active' : 'Deactivated' }}</span>
                    }
                  </td>
                  <td>
                    @if (hasGuideQualification(u)) {
                      <button class="btn btn-ghost btn-sm" type="button" (click)="viewGuideQualification(u)">View photo</button>
                    } @else if (u.role === 'guide') {
                      <small class="muted">Not submitted</small>
                    } @else {
                      —
                    }
                  </td>
                  <td class="actions">
                    @if (u.role === 'guide' && u.account_status === 'pending') {
                      <button class="btn btn-success btn-sm" [disabled]="!hasGuideQualification(u)" (click)="reviewGuide(u, 'approved')">Approve</button>
                      <button class="btn btn-ghost btn-sm danger-text" (click)="reviewGuide(u, 'rejected')">Reject</button>
                    }
                    @if (u.role !== 'admin') {
                      <button class="btn btn-ghost btn-sm" [class.danger-text]="u.is_active" (click)="toggleUser(u)">{{ u.is_active ? 'Deactivate' : 'Activate' }}</button>
                      <button class="btn btn-ghost btn-sm danger-text" type="button" [disabled]="deletingUserIds.has(u.id)" (click)="deleteUser(u)">
                        {{ deletingUserIds.has(u.id) ? 'Deleting…' : 'Delete account' }}
                      </button>
                    }
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="7" class="muted">No {{ userFilter === 'all' ? '' : userFilter + ' ' }}accounts found.</td></tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- REVIEWS -->
      @if (tab === 'reviews') {
        <div class="row between" style="gap:10px;margin-bottom:14px;flex-wrap:wrap">
          <h2 class="h-sm" style="margin:0">Hiker reviews</h2>
          <button class="btn btn-ghost btn-sm" type="button" (click)="loadReviews()">Refresh reviews</button>
        </div>
        <div class="card table-wrap">
          <table class="tbl">
            <thead><tr><th>Hiker</th><th>Trail</th><th>Rating</th><th>Review</th><th>Date</th><th></th></tr></thead>
            <tbody>
              @for (review of reviews; track review.id) {
                <tr>
                  <td><b>{{ review.user?.name || 'Hiker' }}</b></td>
                  <td>{{ review.trail?.name || 'Trail unavailable' }}</td>
                  <td><span class="review-admin-rating">{{ review.rating }} / 5 <app-icon name="star" /></span></td>
                  <td class="review-admin-comment">{{ review.comment || 'No comment.' }}</td>
                  <td>{{ review.created_at | date: 'mediumDate' }}</td>
                  <td class="actions">
                    <button class="btn btn-ghost btn-sm" type="button" (click)="viewReview(review)">View</button>
                    <button class="btn btn-ghost btn-sm danger-text" type="button" (click)="deleteReview(review)">Delete</button>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="muted">No reviews found.</td></tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- BOOKINGS -->
      @if (tab === 'bookings') {
        <div class="card table-wrap">
          <table class="tbl">
            <thead><tr><th>Booking ID</th><th>Trail</th><th>Hiker</th><th>Date</th><th>Group</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>
              @for (b of bookings; track b.id) {
                <tr>
                  <td><span class="code sm">{{ b.booking_code }}</span></td>
                  <td>{{ b.trail?.name }}</td>
                  <td>{{ b.user?.name }}</td>
                  <td>{{ b.trek_date | date: 'mediumDate' }}</td>
                  <td>{{ b.group_size }}</td>
                  <td>{{ b.total_cost | currency: 'PHP' : 'symbol' : '1.0-0' }}</td>
                  <td><span [class]="'badge ' + sClass(b.status)">{{ b.status }}</span></td>
                </tr>
              } @empty {
                <tr><td colspan="7" class="center muted" style="padding:28px">No bookings yet.</td></tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>

    @if (selectedReview) {
      <div class="modal-back" (click)="selectedReview = null">
        <section class="modal admin-review-modal" role="dialog" aria-modal="true" aria-labelledby="admin-review-title" (click)="$event.stopPropagation()">
          <div class="row between" style="gap:12px">
            <h2 id="admin-review-title" class="h-md">Hiker review</h2>
            <button class="btn btn-ghost btn-sm" type="button" (click)="selectedReview = null">Close</button>
          </div>
          <dl class="admin-review-meta">
            <div><dt>Hiker</dt><dd>{{ selectedReview.user?.name || 'Hiker' }}</dd></div>
            <div><dt>Trail</dt><dd>{{ selectedReview.trail?.name || 'Trail unavailable' }}</dd></div>
            <div><dt>Rating</dt><dd class="review-admin-rating">{{ selectedReview.rating }} / 5 <app-icon name="star" /></dd></div>
            <div><dt>Date</dt><dd>{{ selectedReview.created_at | date: 'mediumDate' }}</dd></div>
          </dl>
          <h3 class="h-sm">Comment</h3>
          <p class="admin-review-full-comment">{{ selectedReview.comment || 'No comment provided.' }}</p>
          @if (selectedReview.photos?.length) {
            <h3 class="h-sm">Photos</h3>
            <div class="admin-review-photos">
              @for (photo of selectedReview.photos; track photo) {
                <a [href]="reviewPhotoUrl(photo)" target="_blank" rel="noopener">
                  <img [src]="reviewPhotoUrl(photo)" alt="Photo attached to hiker review" />
                </a>
              }
            </div>
          }
        </section>
      </div>
    }

    @if (selectedGuide) {
      <div class="modal-back" (click)="closeGuideQualification()">
        <section class="modal wide guide-qualification-modal" role="dialog" aria-modal="true" aria-labelledby="guide-qualification-title" (click)="$event.stopPropagation()">
          <div class="row between" style="gap:12px">
            <div>
              <h2 id="guide-qualification-title" class="h-md">Guide qualification proof</h2>
              <p class="muted">{{ selectedGuide.name }} · {{ selectedGuide.email }}</p>
            </div>
            <button class="btn btn-ghost btn-sm" type="button" (click)="closeGuideQualification()">Close</button>
          </div>
          @if (loadingGuideQualification) {
            <p class="muted">Loading qualification photo…</p>
          } @else if (guideQualificationPhotoUrl) {
            <img class="guide-qualification-admin-preview" [src]="guideQualificationPhotoUrl" alt="Qualification proof submitted by {{ selectedGuide.name }}" />
          }
        </section>
      </div>
    }
  `,
})
export class AdminDashboardComponent implements OnDestroy, OnInit {
  private api = inject(ApiService);
  private confirmation = inject(ConfirmationService);
  private toast = inject(ToastService);

  tab: Tab = 'overview';
  userFilter: UserFilter = 'all';
  sClass = statusClass;

  stats: AdminStats | null = null;
  report: Report | null = null;
  trails: Trail[] = [];
  users: User[] = [];
  deletingUserIds = new Set<number>();
  reviews: Review[] = [];
  selectedReview: Review | null = null;
  selectedGuide: User | null = null;
  guideQualificationPhotoUrl = '';
  loadingGuideQualification = false;
  flaggedUsers: User[] = [];
  bookings: Booking[] = [];
  editingTrail: Trail | null = null;
  galleryTrail: Trail | null = null;
  galleryImageUrl: string | null = null;
  savingTrail = false;
  savingGalleryImageUrl = false;
  uploadingPicture = false;
  selectedGalleryPhotos: File[] = [];
  uploadingGalleryPhotos = false;
  deletingGalleryPhotoId: string | null = null;
  selectedPicture: File | null = null;
  picturePreview = '';
  trailEdit = {
    name: '',
    location: '',
    latitude: null as number | null,
    longitude: null as number | null,
    image_url: null as string | null,
    entrance_fee: 0,
    guide_fee: 0,
  };
  showCreateTrail = false;
  categories = CATEGORIES;
  creatingTrail = false;
  newTrail = this.emptyNewTrail();

  trailFilter = 'pending';
  trailFilters = [
    { key: 'pending', label: 'Pending review' },
    { key: 'verified', label: 'Verified' },
    { key: 'rejected', label: 'Rejected' },
    { key: '', label: 'All' },
  ];

  get guideUsers(): User[] {
    return this.users.filter((user) => user.role === 'guide' && user.is_active !== false);
  }

  private emptyNewTrail() {
    return {
      user_id: null as number | null,
      name: '', location: '', category: 'Mountain', difficulty: 'Moderate', trip_type: 'Day Hike',
      description: '', elevation: 0, distance_km: 0, duration_hours: 0,
      entrance_fee: 0, guide_fee: 0, permits: '', max_daily_visitors: 30,
      latitude: null as number | null, longitude: null as number | null,
      image_url: null as string | null, featuresText: '', safety_advisory: '', lnt_notes: '',
    };
  }

  ngOnInit() {
    this.loadStats();
    this.loadTrails();
    this.api.adminReports().subscribe({ next: (r) => (this.report = r), error: () => {} });
    this.loadUsers();
    this.api.adminFlaggedUsers().subscribe({ next: (u) => (this.flaggedUsers = u), error: (e) => this.toast.err(errMsg(e)) });
    this.loadBookings();
  }

  ngOnDestroy() {
    this.closeGuideQualification();
  }

  loadStats() {
    this.api.adminStats().subscribe({ next: (s) => (this.stats = s), error: (e) => this.toast.err(errMsg(e)) });
  }

  loadUsers() {
    this.api.adminUsers().subscribe({ next: (users) => (this.users = users), error: (e) => this.toast.err(errMsg(e)) });
  }

  loadBookings() {
    this.api.adminBookings().subscribe({
      next: (bookings) => (this.bookings = bookings),
      error: (e) => this.toast.err(errMsg(e)),
    });
  }

  viewGuideQualification(user: User) {
    this.closeGuideQualification();
    this.selectedGuide = user;
    this.loadingGuideQualification = true;
    this.api.adminGuideQualificationPhoto(user.id).subscribe({
      next: (photo) => {
        if (this.selectedGuide?.id !== user.id) return;
        this.guideQualificationPhotoUrl = URL.createObjectURL(photo);
        this.loadingGuideQualification = false;
      },
      error: (e) => {
        if (this.selectedGuide?.id !== user.id) return;
        this.closeGuideQualification();
        this.toast.err(errMsg(e));
      },
    });
  }

  closeGuideQualification() {
    if (this.guideQualificationPhotoUrl) URL.revokeObjectURL(this.guideQualificationPhotoUrl);
    this.guideQualificationPhotoUrl = '';
    this.selectedGuide = null;
    this.loadingGuideQualification = false;
  }

  loadReviews() {
    this.api.adminReviews().subscribe({ next: (reviews) => (this.reviews = reviews), error: (e) => this.toast.err(errMsg(e)) });
  }

  viewReview(review: Review) {
    this.selectedReview = review;
  }

  reviewPhotoUrl(photo: string): string {
    if (/^https?:\/\//i.test(photo)) return photo;
    const baseUrl = API_URL.replace(/\/api$/, '');
    return photo.startsWith('/') ? `${baseUrl}${photo}` : `${baseUrl}/${photo}`;
  }

  async deleteReview(review: Review) {
    const hikerName = review.user?.name || 'this hiker';
    const confirmed = await this.confirmation.confirm({
      tone: 'danger',
      title: 'Delete this review?',
      message: `Delete ${hikerName}'s review? This action cannot be undone.`,
      detail: review.trail?.name || 'Trail review',
      confirmLabel: 'Delete review',
      cancelLabel: 'Keep review',
    });
    if (!confirmed) return;

    this.api.adminDeleteReview(review.id).subscribe({
      next: () => {
        this.reviews = this.reviews.filter((item) => item.id !== review.id);
        this.toast.ok('Review deleted.');
      },
      error: (e) => this.toast.err(errMsg(e)),
    });
  }

  get filteredUsers(): User[] {
    return this.userFilter === 'all' ? this.users : this.users.filter((user) => user.role === this.userFilter);
  }

  countUsers(role: UserFilter): number {
    return this.users.filter((user) => user.role === role).length;
  }

  hasGuideQualification(user: User): boolean {
    return user.role === 'guide' && user.has_guide_qualification === true;
  }

  loadTrails() {
    this.api.adminTrails(this.trailFilter).subscribe({
      next: (t) => (this.trails = t),
      error: (e) => this.toast.err(errMsg(e)),
    });
  }

  openTrailEdit(trail: Trail) {
    if (this.editingTrail?.id === trail.id) {
      this.closeTrailEdit();
      return;
    }
    this.closeTrailGallery();
    this.editingTrail = trail;
    this.trailEdit = {
      name: trail.name,
      location: trail.location,
      latitude: trail.latitude ?? null,
      longitude: trail.longitude ?? null,
      image_url: trail.image_url ?? null,
      entrance_fee: trail.entrance_fee,
      guide_fee: trail.guide_fee,
    };
  }

  openTrailGallery(trail: Trail) {
    if (this.galleryTrail?.id === trail.id) {
      this.closeTrailGallery();
      return;
    }
    this.closeTrailEdit();
    this.galleryTrail = trail;
    this.galleryImageUrl = trail.image_url ?? null;
    this.selectedPicture = null;
    this.picturePreview = '';
    this.selectedGalleryPhotos = [];
    setTimeout(() => document.getElementById('trail-gallery-editor')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  }

  openGalleryPhotoPicker() {
    document.getElementById('trail-gallery-photos')?.click();
  }

  closeTrailEdit() {
    this.editingTrail = null;
  }

  closeTrailGallery() {
    this.galleryTrail = null;
    this.galleryImageUrl = null;
    this.selectedPicture = null;
    this.picturePreview = '';
    this.selectedGalleryPhotos = [];
  }

  onGalleryPhotosSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.selectedGalleryPhotos = Array.from(input.files || []).slice(0, 10);
    if ((input.files?.length || 0) > 10) {
      this.toast.err('You can upload at most 10 gallery photos at a time.');
      input.value = '';
    }
  }

  uploadGalleryPhotos() {
    const trail = this.galleryTrail;
    if (!trail || !this.selectedGalleryPhotos.length) return;

    this.uploadingGalleryPhotos = true;
    this.api.adminUploadTrailPhotos(trail.id, this.selectedGalleryPhotos).subscribe({
      next: (photos) => {
        this.uploadingGalleryPhotos = false;
        trail.photos = [...(trail.photos || []), ...(photos || [])];
        this.selectedGalleryPhotos = [];
        const input = document.getElementById('trail-gallery-photos') as HTMLInputElement | null;
        if (input) input.value = '';
        this.toast.ok('Trail gallery photos uploaded.');
      },
      error: (e) => {
        this.uploadingGalleryPhotos = false;
        this.toast.err(errMsg(e));
      },
    });
  }

  async deleteGalleryPhoto(photoId: string) {
    const trail = this.galleryTrail;
    if (!trail) return;
    const confirmed = await this.confirmation.confirm({
      tone: 'danger',
      title: 'Remove this trail photo?',
      message: 'This photo will be removed from the trail gallery.',
      detail: trail.name,
      confirmLabel: 'Remove photo',
      cancelLabel: 'Keep photo',
    });
    if (!confirmed) return;

    this.deletingGalleryPhotoId = photoId;
    this.api.adminDeleteTrailPhoto(trail.id, photoId).subscribe({
      next: (response) => {
        this.deletingGalleryPhotoId = null;
        trail.photos = response.photos;
        this.toast.ok(response.message);
      },
      error: (e) => {
        this.deletingGalleryPhotoId = null;
        this.toast.err(errMsg(e));
      },
    });
  }

  onPictureSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) return;
    this.selectedPicture = file;
    const reader = new FileReader();
    reader.onload = () => { this.picturePreview = String(reader.result || ''); };
    reader.readAsDataURL(file);
  }

  uploadTrailPicture() {
    if (!this.galleryTrail || !this.selectedPicture) return;
    this.uploadingPicture = true;
    const trailId = this.galleryTrail.id;
    this.api.adminUpdateTrailPicture(trailId, this.selectedPicture).subscribe({
      next: (updated) => {
        this.uploadingPicture = false;
        this.selectedPicture = null;
        this.picturePreview = '';
        this.galleryImageUrl = updated.image_url ?? null;
        const index = this.trails.findIndex((trail) => trail.id === trailId);
        if (index >= 0) this.trails[index] = updated;
        this.galleryTrail = updated;
        this.toast.ok('Trail picture updated.');
      },
      error: (e) => {
        this.uploadingPicture = false;
        this.toast.err(errMsg(e));
      },
    });
  }

  saveGalleryImageUrl() {
    const trail = this.galleryTrail;
    if (!trail) return;

    this.savingGalleryImageUrl = true;
    this.api.adminUpdateTrail(trail.id, {
      name: trail.name,
      location: trail.location,
      latitude: trail.latitude ?? null,
      longitude: trail.longitude ?? null,
      image_url: this.galleryImageUrl?.trim() || null,
      entrance_fee: trail.entrance_fee,
      guide_fee: trail.guide_fee,
    }).subscribe({
      next: (updated) => {
        this.savingGalleryImageUrl = false;
        this.galleryTrail = updated;
        this.galleryImageUrl = updated.image_url ?? null;
        const index = this.trails.findIndex((item) => item.id === updated.id);
        if (index >= 0) this.trails[index] = updated;
        this.toast.ok(`Cover photo URL saved for "${updated.name}".`);
      },
      error: (e) => {
        this.savingGalleryImageUrl = false;
        this.toast.err(errMsg(e));
      },
    });
  }

  saveTrailEdit() {
    if (!this.editingTrail) return;
    this.savingTrail = true;
    const trailId = this.editingTrail.id;
    this.api.adminUpdateTrail(trailId, this.trailEdit).subscribe({
      next: (updated) => {
        const index = this.trails.findIndex((trail) => trail.id === trailId);
        if (index >= 0) this.trails[index] = updated;
        this.savingTrail = false;
        this.closeTrailEdit();
        this.toast.ok(`"${updated.name}" has been updated.`);
      },
      error: (e) => {
        this.savingTrail = false;
        this.toast.err(errMsg(e));
      },
    });
  }

  createTrail() {
    if (!this.newTrail.user_id || !this.newTrail.name.trim() || !this.newTrail.description.trim()) {
      this.toast.err('Please select a guide and enter the place name and description.');
      return;
    }
    this.creatingTrail = true;
    const payload = {
      ...this.newTrail,
      features: this.newTrail.featuresText
        ? this.newTrail.featuresText.split(',').map((feature) => feature.trim()).filter(Boolean)
        : [],
    };
    this.api.adminCreateTrail(payload).subscribe({
      next: (trail) => {
        this.creatingTrail = false;
        this.showCreateTrail = false;
        this.newTrail = this.emptyNewTrail();
        this.trailFilter = 'verified';
        this.loadTrails();
        this.loadStats();
        this.toast.ok(`"${trail.name}" was added and verified.`);
      },
      error: (e) => {
        this.creatingTrail = false;
        this.toast.err(errMsg(e));
      },
    });
  }

  clearSpam(user: User) {
    this.api.adminReviewValidation(user.id, 'clear').subscribe({
      next: () => {
        this.flaggedUsers = this.flaggedUsers.filter((u) => u.id !== user.id);
        this.toast.ok(`Anti-spam restriction cleared for ${user.name}.`);
      },
      error: (e) => this.toast.err(errMsg(e)),
    });
  }

  async declareSpam(user: User) {
    const confirmed = await this.confirmation.confirm({
      tone: 'danger',
      title: 'Declare this account as spam?',
      message: 'This blocks the account from sending booking or trail requests until an administrator clears it.',
      detail: `${user.name} · ${user.email}`,
      confirmLabel: 'Declare spam',
      cancelLabel: 'Keep in review',
    });
    if (!confirmed) return;

    this.api.adminReviewValidation(user.id, 'flagged').subscribe({
      next: (updated) => {
        user.spam_validation_status = updated.spam_validation_status;
        user.spam_restriction_expires_at = updated.spam_restriction_expires_at;
        this.toast.ok(`${user.name} was declared spam and blocked until cleared by an administrator.`);
      },
      error: (e) => this.toast.err(errMsg(e)),
    });
  }

  async reviewGuide(user: User, status: 'approved' | 'rejected') {
    if (status === 'rejected') {
      const confirmed = await this.confirmation.confirm({
        tone: 'danger',
        title: 'Reject guide application?',
        message: 'This guide account application will be rejected.',
        detail: `${user.name} · ${user.email}`,
        confirmLabel: 'Reject application',
        cancelLabel: 'Review again',
      });
      if (!confirmed) return;
    }

    this.api.adminReviewGuide(user.id, status).subscribe({
      next: (updated) => {
        user.account_status = updated.account_status;
        user.is_active = updated.is_active;
        user.guide_visible = updated.guide_visible;
        this.toast.ok(status === 'approved' ? `${user.name}'s guide account was approved.` : `${user.name}'s guide account was rejected.`);
        this.loadStats();
      },
      error: (e) => this.toast.err(errMsg(e)),
    });
  }

  async deleteUser(user: User) {
    const confirmed = await this.confirmation.confirm({
      tone: 'danger',
      title: 'Delete this account?',
      message: 'This permanently deletes the account, its bookings and reviews, and any trails and qualification photos belonging to the account. This cannot be undone.',
      detail: `${user.name} · ${user.email}`,
      confirmLabel: 'Delete account',
      cancelLabel: 'Keep account',
    });
    if (!confirmed) return;

    this.deletingUserIds.add(user.id);
    this.api.adminDeleteUser(user.id).subscribe({
      next: (response) => {
        this.deletingUserIds.delete(user.id);
        this.users = this.users.filter((item) => item.id !== user.id);
        this.toast.ok(response.message);
        this.loadStats();
        this.loadTrails();
        this.loadBookings();
        this.loadReviews();
      },
      error: (e) => {
        this.deletingUserIds.delete(user.id);
        this.toast.err(errMsg(e));
      },
    });
  }

  verify(t: Trail, status: string) {
    this.api.adminVerifyTrail(t.id, status).subscribe({
      next: () => {
        this.toast.ok(`"${t.name}" is now ${status}.`);
        this.loadTrails();
        this.loadStats();
      },
      error: (e) => this.toast.err(errMsg(e)),
    });
  }

  toggleTrailVisibility(t: Trail) {
    this.api.adminToggleTrailVisibility(t.id).subscribe({
      next: (updated) => {
        t.is_active = updated.is_active;
        this.toast.ok(updated.is_active ? `"${t.name}" is visible to hikers.` : `"${t.name}" is hidden from hikers.`);
      },
      error: (e) => this.toast.err(errMsg(e)),
    });
  }

  toggleUser(u: User) {
    this.api.adminToggleUser(u.id).subscribe({
      next: (res) => {
        u.is_active = res.is_active;
        this.toast.ok(`${u.name} is now ${res.is_active ? 'active' : 'deactivated'}.`);
      },
      error: (e) => this.toast.err(errMsg(e)),
    });
  }
}