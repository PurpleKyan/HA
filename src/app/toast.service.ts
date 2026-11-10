import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  text: string;
  type: 'ok' | 'err';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);
  private counter = 0;

  show(text: string, type: 'ok' | 'err' = 'ok') {
    const id = ++this.counter;
    this.toasts.update((list) => [...list, { id, text, type }]);
    setTimeout(() => this.toasts.update((list) => list.filter((t) => t.id !== id)), 4000);
  }

  ok(text: string) {
    this.show(text, 'ok');
  }

  err(text: string) {
    this.show(text, 'err');
  }
}