import { Component, HostListener, inject } from '@angular/core';
import { ConfirmationService } from '../confirmation.service';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  template: `
    @if (confirmation.active(); as request) {
      <div class="modal-back app-confirm-backdrop" role="presentation" (click)="confirmation.close(false)">
        <section
          class="app-confirm-dialog"
          [class]="'app-confirm-dialog tone-' + (request.tone || 'warning')"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="app-confirm-title"
          aria-describedby="app-confirm-message"
          (click)="$event.stopPropagation()"
        >
          <div class="app-confirm-mark" aria-hidden="true">{{ mark(request.tone) }}</div>
          <span class="app-confirm-eyebrow">Please confirm</span>
          <h2 id="app-confirm-title">{{ request.title }}</h2>
          <p id="app-confirm-message">{{ request.message }}</p>
          @if (request.detail) {
            <div class="app-confirm-detail">{{ request.detail }}</div>
          }
          <div class="app-confirm-actions">
            <button class="btn btn-ghost" type="button" (click)="confirmation.close(false)">
              {{ request.cancelLabel || 'Go back' }}
            </button>
            <button class="btn app-confirm-submit" type="button" (click)="confirmation.close(true)">
              {{ request.confirmLabel || 'Confirm' }}
            </button>
          </div>
        </section>
      </div>
    }
  `,
})
export class ConfirmationDialogComponent {
  confirmation = inject(ConfirmationService);

  @HostListener('document:keydown.escape')
  dismissOnEscape(): void {
    if (this.confirmation.active()) this.confirmation.close(false);
  }

  mark(tone?: string): string {
    if (tone === 'danger') return '!';
    if (tone === 'success') return '✓';
    return '?';
  }
}
