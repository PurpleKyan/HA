import { CurrencyPipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { AppIconComponent } from './app-icon.component';
import { BOOKING_STATUSES, Report } from '../models';
import { statusClass } from '../utils';

@Component({
  selector: 'app-report-view',
  standalone: true,
  imports: [CurrencyPipe, AppIconComponent],
  template: `
    @if (report) {
      <div class="stat-grid">
        <div class="stat"><span class="stat-ico"><app-icon name="booking" /></span><div><b>{{ report.total_bookings }}</b><small>Total requests</small></div></div>
        <div class="stat"><span class="stat-ico"><app-icon name="hiking" /></span><div><b>{{ report.total_visitors }}</b><small>Expected / actual visitors</small></div></div>
        <div class="stat"><span class="stat-ico"><app-icon name="clock" /></span><div><b>{{ report.status_counts['Pending'] || 0 }}</b><small>Pending requests</small></div></div>
        <div class="stat"><span class="stat-ico"><app-icon name="money" /></span><div><b>{{ report.completed_revenue | currency: 'PHP' : 'symbol' : '1.0-0' }}</b><small>Completed trek fees</small></div></div>
      </div>

      <div class="grid grid-2" style="margin-top:18px">
        <div class="card card-pad">
          <h3 class="h-sm">Booking status summary</h3>
          @for (s of statuses; track s) {
            <div class="bar-row">
              <span [class]="'badge ' + sClass(s)" style="min-width:92px;justify-content:center">{{ s }}</span>
              <div class="bar"><i [style.width.%]="statusPct(s)"></i></div>
              <b>{{ report.status_counts[s] || 0 }}</b>
            </div>
          }
        </div>

        <div class="card card-pad">
          <h3 class="h-sm">Visitor volume by trail</h3>
          @for (t of report.by_trail; track t.trail) {
            <div class="bar-row">
              <span class="bar-label" [title]="t.trail">{{ t.trail }}</span>
              <div class="bar"><i class="bar-alt" [style.width.%]="trailPct(t.visitors)"></i></div>
              <b>{{ t.visitors }}</b>
            </div>
          } @empty {
            <p class="muted">No bookings yet.</p>
          }
        </div>
      </div>

      <div class="card card-pad" style="margin-top:18px">
        <h3 class="h-sm">Monthly visitor volume (Approved + Completed)</h3>
        @if (report.by_month.length) {
          <div class="table-wrap">
            <table class="tbl">
              <thead><tr><th>Month</th><th>Bookings</th><th>Visitors</th></tr></thead>
              <tbody>
                @for (m of report.by_month; track m.month) {
                  <tr><td>{{ m.month }}</td><td>{{ m.bookings }}</td><td>{{ m.visitors }}</td></tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <p class="muted">No approved or completed treks yet.</p>
        }
      </div>
    }
  `,
})
export class ReportViewComponent {
  @Input() report: Report | null = null;

  statuses = BOOKING_STATUSES;
  sClass = statusClass;

  statusPct(status: string): number {
    if (!this.report || !this.report.total_bookings) return 0;
    return Math.round(((this.report.status_counts[status] || 0) / this.report.total_bookings) * 100);
  }

  trailPct(visitors: number): number {
    if (!this.report || !this.report.by_trail.length) return 0;
    const max = Math.max(...this.report.by_trail.map((t) => t.visitors), 1);
    return Math.round((visitors / max) * 100);
  }
}