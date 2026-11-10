import { Injectable, signal } from '@angular/core';

export type ConfirmationTone = 'danger' | 'success' | 'warning';

export interface ConfirmationOptions {
  title: string;
  message: string;
  detail?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmationTone;
}

@Injectable({ providedIn: 'root' })
export class ConfirmationService {
  private activeRequest = signal<ConfirmationOptions | null>(null);
  readonly active = this.activeRequest.asReadonly();
  private resolveRequest: ((confirmed: boolean) => void) | null = null;

  confirm(options: ConfirmationOptions): Promise<boolean> {
    if (this.resolveRequest) {
      this.resolveRequest(false);
    }

    return new Promise((resolve) => {
      this.resolveRequest = resolve;
      this.activeRequest.set(options);
    });
  }

  close(confirmed: boolean): void {
    const resolve = this.resolveRequest;
    this.resolveRequest = null;
    this.activeRequest.set(null);
    resolve?.(confirmed);
  }
}
