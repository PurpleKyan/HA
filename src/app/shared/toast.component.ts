import { Component, inject } from '@angular/core';
import { ToastService } from '../toast.service';
import { AppIconComponent } from './app-icon.component';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [AppIconComponent],
  template: `
    <div class="toasts">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast" [class.toast-err]="t.type === 'err'">
          <app-icon [name]="t.type === 'ok' ? 'success' : 'warning'" /> {{ t.text }}
        </div>
      }
    </div>
  `,
})
export class ToastComponent {
  toast = inject(ToastService);
}