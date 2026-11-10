import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../api.service';
import { AuthService } from '../../auth.service';
import { ConfirmationService } from '../../confirmation.service';
import { BOOKING_STATUSES, Booking, DIFFICULTIES, FEATURES, Report, TRIP_TYPES, Trail } from '../../models';
import { AppIconComponent } from '../../shared/app-icon.component';
import { ReportViewComponent } from '../../shared/report-view.component';
import { ToastService } from '../../toast.service';
import { errMsg, statusClass } from '../../utils';

type Tab = 'overview' | 'trails' | 'bookings';

@Component({
  selector: 'app-guide-dashboard',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, DatePipe, AppIconComponent, ReportViewComponent],
  template: `
    <section class="page-head">
      <div class="container row between" style="flex-wrap:wrap;gap:12px">
        <div>
          <h1 class="h-xl">Guide dashboard</h1>
          <p>Hello, {{ auth.user()?.name }}. Manage your trails and reservation requests.</p>
        </div>
        @if (pendingCount() > 0) {
          <button class="btn btn-accent" (click)="tab = 'bookings'; statusFilter = 'Pending'"><app-icon name="clock" /> {{ pendingCount() }} pending request(s)</button>
        }
      </div>
    </section>

    <section class="container section tight">
      <div class="tabs">
        <button class="tab" [class.active]="tab === 'overview'" (click)="tab = 'overview'"><app-icon name="dashboard" /> Overview &amp; reports</button>
        <button class="tab" [class.active]="tab === 'trails'" (click)="tab = 'trails'"><app-icon name="hiking" /> My trails ({{ trails.length }})</button>
        <button class="tab" [class.active]="tab === 'bookings'" (click)="tab = 'bookings'"><app-icon name="booking" /> Booking requests ({{ bookings.length }})</button>
      </div>

      <!-- OVERVIEW -->
      @if (tab === 'overview') {
        <app-report-view [report]="report" />
      }

      <!-- TRAILS -->
      @if (tab === 'trails') {
        <div class="row between" style="margin-bottom:14px;flex-wrap:wrap;gap:10px">
          <p class="muted" style="margin:0">Control whether hikers can select your guide name when booking.</p>
          <label class="row" style="align-items:center;gap:10px">
            <b>Visible in guide selection</b>
            <label class="switch">
              <input type="checkbox" [checked]="guideVisible" (change)="toggleGuideVisibility()" />
              <span></span>
            </label>
          </label>
        </div>
        <div class="card table-wrap">
          <table class="tbl">
            <thead>
              <tr><th>Trail</th><th>Location</th><th>Difficulty</th><th>Fees</th><th>Daily limit</th><th>Verification</th></tr>
            </thead>
            <tbody>
              @for (t of trails; track t.id) {
                <tr>
                  <td><b>{{ t.name }}</b><br /><small class="muted">{{ t.category }} · {{ t.trip_type }}</small></td>
                  <td>{{ t.location }}</td>
                  <td>{{ t.difficulty }}</td>
                  <td>{{ t.entrance_fee | currency: 'PHP' : 'symbol' : '1.0-0' }} + {{ t.guide_fee | currency: 'PHP' : 'symbol' : '1.0-0' }}</td>
                  <td>{{ t.max_daily_visitors }}</td>
                  <td><span [class]="'badge ' + sClass(t.status)">{{ t.status }}</span></td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="center muted" style="padding:28px">You have no assigned trails yet.</td></tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- BOOKINGS -->
      @if (tab === 'bookings') {
        <div class="row" style="gap:10px;margin-bottom:14px;flex-wrap:wrap">
          <button class="chip" [class.on]="statusFilter === ''" (click)="statusFilter = ''">All</button>
          @for (s of statuses; track s) {
            <button class="chip" [class.on]="statusFilter === s" (click)="statusFilter = s">{{ s }}</button>
          }
        </div>

        @for (b of visibleBookings(); track b.id) {
          <article class="card card-pad req">
            <div class="row between" style="flex-wrap:wrap;gap:8px">
              <div>
                <div class="code sm">{{ b.booking_code }}</div>
                <h3 class="h-sm" style="margin:6px 0 0">{{ b.trail?.name }}</h3>
              </div>
              <span [class]="'badge ' + sClass(b.status)">{{ b.status }}</span>
            </div>
            <div class="kv">
              <span>📅 <b>{{ b.trek_date | date: 'mediumDate' }}</b></span>
              <span><app-icon name="group" /> <b>{{ b.group_size }}</b> hiker(s)</span>
              <span><app-icon name="money" /> <b>{{ b.total_cost | currency: 'PHP' : 'symbol' : '1.0-0' }}</b></span>
            </div>
            <div class="req-grid">
              <div class="hiker-contact">
                <h4 class="hiker-contact-title">Hiker details</h4>
                <div class="hiker-contact-name">{{ b.user?.name }}</div>
                <div class="hiker-contact-meta">{{ b.user?.email }}<br />{{ b.user?.phone || 'No phone' }}</div>
              </div>
              <div><small class="muted">Itinerary</small><div class="small">{{ b.itinerary || '—' }}</div></div>
              <div><small class="muted">Special requirements</small><div class="small">{{ b.special_requirements || '—' }}</div></div>
            </div>
            <div class="timeline">
              @for (l of b.logs || []; track l.id) {
                <div class="tl-item"><i [class]="'dot ' + sClass(l.status)"></i><b>{{ l.status }}</b><small class="muted">{{ l.created_at | date: 'MMM d, y, h:mm a' }}</small></div>
              }
            </div>
            <div class="row" style="gap:8px;margin-top:12px;flex-wrap:wrap">
              @if (b.status === 'Pending') {
                <button class="btn btn-success btn-sm" (click)="setStatus(b, 'Approved')">✓ Approve</button>
                <button class="btn btn-ghost btn-sm danger-text" (click)="setStatus(b, 'Cancelled')">✕ Decline</button>
              }
              @if (b.status === 'Approved') {
                <button class="btn btn-primary btn-sm" (click)="setStatus(b, 'Completed')">🏁 Mark completed</button>
                <button class="btn btn-ghost btn-sm danger-text" (click)="setStatus(b, 'Cancelled')">Cancel</button>
              }
              @if (b.status === 'Completed') {
                <button class="btn btn-ghost btn-sm danger-text" type="button" [disabled]="deletingBookingIds.has(b.id)" (click)="deleteCompletedBooking(b)">
                  {{ deletingBookingIds.has(b.id) ? 'Deleting…' : 'Delete booking history' }}
                </button>
                @if (b.review) {
                  <span class="muted small">Deleting this booking also removes its review.</span>
                }
              }
            </div>
          </article>
        } @empty {
          <div class="empty"><div style="font-size:2.4rem">📭</div><h3>No requests here</h3><p class="muted">Requests from hikers will show up in this list.</p></div>
        }
      }
    </section>

  `,
})

export class GuideDashboardComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private confirmation = inject(ConfirmationService);
  auth = inject(AuthService);

  tab: Tab = 'overview';
  statuses = BOOKING_STATUSES;
  difficulties = DIFFICULTIES;
  tripTypes = TRIP_TYPES;
  featureList = FEATURES;
  sClass = statusClass;

  trails: Trail[] = [];
  bookings: Booking[] = [];
  deletingBookingIds = new Set<number>();
  report: Report | null = null;
  statusFilter = '';
  guideVisible = true;

  form: any = null;
  editingId: number | null = null;
  saving = false;
  formError = '';

  ngOnInit() {
    this.loadAll();
  }

  loadAll() {
    this.api.guideTrails().subscribe({ next: (t) => (this.trails = t), error: (e) => this.toast.err(errMsg(e)) });
    this.api.guideVisibility().subscribe({ next: (res) => (this.guideVisible = res.guide_visible), error: (e) => this.toast.err(errMsg(e)) });
    this.loadBookings();
    this.loadReport();
  }
  loadBookings() {
    this.api.guideBookings().subscribe({ next: (b) => (this.bookings = b), error: (e) => this.toast.err(errMsg(e)) });
  }
  loadReport() {
    this.api.guideReports().subscribe({ next: (r) => (this.report = r), error: () => {} });
  }

  pendingCount() {
    return this.bookings.filter((b) => b.status === 'Pending').length;
  }
  visibleBookings() {
    return this.statusFilter ? this.bookings.filter((b) => b.status === this.statusFilter) : this.bookings;
  }

  toggleGuideVisibility() {
    this.api.guideToggleVisibility().subscribe({
      next: (res) => {
        this.guideVisible = res.guide_visible;
        this.toast.ok(res.guide_visible ? 'Your guide name is now visible to hikers.' : 'Your guide name is hidden from guide selection.');
        this.auth.refreshUser();
      },
      error: (e) => this.toast.err(errMsg(e)),
    });
  }

  // ----- bookings -----
  async setStatus(booking: Booking, status: string) {
    const isApproval = status === 'Approved';
    const isDecline = status === 'Cancelled' && booking.status === 'Pending';
    const isCancellation = status === 'Cancelled' && booking.status === 'Approved';
    const confirmed = await this.confirmation.confirm({
      tone: isApproval ? 'success' : isDecline || isCancellation ? 'danger' : 'warning',
      title: isApproval ? 'Approve this booking?' : isDecline ? 'Decline this booking?' : isCancellation ? 'Cancel this booking?' : 'Mark trek completed?',
      message: isApproval
        ? 'The hiker will be notified that their reservation is approved.'
        : isDecline
          ? 'This reservation request will be declined. The hiker will be notified.'
          : isCancellation
            ? 'This approved booking will be cancelled and the hiker will be notified.'
            : 'Confirm that this trek has been completed.',
      detail: `${booking.booking_code} · ${booking.trail?.name || 'Trail booking'} · ${booking.user?.name || 'Hiker'}`,
      confirmLabel: isApproval ? 'Approve booking' : isDecline ? 'Decline booking' : isCancellation ? 'Cancel booking' : 'Mark completed',
      cancelLabel: 'Keep booking',
    });
    if (!confirmed) return;

    this.api.guideSetStatus(booking.id, status).subscribe({
      next: () => {
        this.toast.ok(`Booking marked as ${status}.`);
        this.loadBookings();
        this.loadReport();
      },
      error: (e) => this.toast.err(errMsg(e)),
    });
  }

  async deleteCompletedBooking(booking: Booking) {
    const confirmed = await this.confirmation.confirm({
      tone: 'danger',
      title: 'Delete completed booking history?',
      message: 'This permanently deletes the completed booking, its review, and review photos. This cannot be undone.',
      detail: `${booking.booking_code} · ${booking.trail?.name || 'Trail booking'} · ${booking.user?.name || 'Hiker'}`,
      confirmLabel: 'Delete history',
      cancelLabel: 'Keep booking',
    });
    if (!confirmed) return;

    this.deletingBookingIds.add(booking.id);
    this.api.guideDeleteCompletedBooking(booking.id).subscribe({
      next: (response) => {
        this.deletingBookingIds.delete(booking.id);
        this.bookings = this.bookings.filter((item) => item.id !== booking.id);
        this.toast.ok(response.message);
        this.loadReport();
      },
      error: (e) => {
        this.deletingBookingIds.delete(booking.id);
        this.toast.err(errMsg(e));
      },
    });
  }

}