import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../api.service';
import { ToastService } from '../toast.service';
import { errMsg } from '../utils';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <section class="auth-wrap">
      <div class="auth-card">
        <div class="auth-head">
          <h1 class="h-md">Reset your password</h1>
          <p class="muted">Enter the six-digit code sent to your email, then choose a new password.</p>
        </div>

        @if (error) {
          <div class="alert alert-error">{{ error }}</div>
        }

        <form (ngSubmit)="submit()" #form="ngForm" autocomplete="off">
          <div class="field">
            <label for="email">Email</label>
            <input id="email" name="email" type="email" [(ngModel)]="email" #emailField="ngModel" required email pattern="[a-z0-9._%+-]+@gmail\.com" placeholder="example@gmail.com" autocomplete="email" />
            @if (emailField.invalid && (emailField.dirty || emailField.touched)) {
              <small class="field-error">Enter a valid Gmail address ending in &#64;gmail.com.</small>
            }
          </div>
          <div class="field">
            <label for="code">Six-digit code</label>
            <input id="code" name="code" type="text" [(ngModel)]="code" #codeField="ngModel" required pattern="^[0-9]{6}$" maxlength="6" inputmode="numeric" autocomplete="one-time-code" />
            @if (codeField.invalid && (codeField.dirty || codeField.touched)) {
              <small class="field-error">Enter the six-digit code from your email.</small>
            }
          </div>
          <div class="field">
            <label for="password">New password</label>
            <input id="password" name="password" type="password" [(ngModel)]="password" #passwordField="ngModel" required minlength="8" autocomplete="new-password" />
            @if (passwordField.errors?.['minlength'] && (passwordField.dirty || passwordField.touched)) {
              <small class="field-error">Password must be at least 8 characters.</small>
            }
          </div>
          <div class="field">
            <label for="password-confirmation">Confirm password</label>
            <input id="password-confirmation" name="password_confirmation" type="password" [(ngModel)]="passwordConfirmation" #confirmationField="ngModel" required minlength="8" autocomplete="new-password" />
            @if (confirmationField.invalid && (confirmationField.dirty || confirmationField.touched)) {
              <small class="field-error">Confirm your password using at least 8 characters.</small>
            } @else if (passwordConfirmation && password !== passwordConfirmation) {
              <small class="field-error">The passwords do not match.</small>
            }
          </div>
          <button class="btn btn-primary btn-block reset-submit" type="submit" [disabled]="loading || !form.valid || password !== passwordConfirmation">
            {{ loading ? 'Updating password…' : 'Update password' }}
          </button>
          @if (!form.valid || password !== passwordConfirmation) {
            <small class="field-error" role="status">Enter a valid Gmail address, six-digit code, and matching passwords of at least 8 characters to continue.</small>
          }
        </form>

        <p class="auth-foot"><a routerLink="/login">Back to login</a></p>
      </div>
    </section>
  `,
})
export class ResetPasswordComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  email = '';
  code = '';
  password = '';
  passwordConfirmation = '';
  loading = false;
  error = '';

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.email = params.get('email') || '';
      this.code = '';
      this.password = '';
      this.passwordConfirmation = '';
      this.loading = false;
      this.error = '';
    });
  }

  submit(): void {
    this.loading = true;
    this.error = '';

    this.api.resetPassword({
      email: this.email,
      code: this.code,
      password: this.password,
      password_confirmation: this.passwordConfirmation,
    }).subscribe({
      next: (response) => {
        this.loading = false;
        this.toast.ok(response.message);
        this.router.navigate(['/login']);
      },
      error: (requestError) => {
        this.loading = false;
        this.error = errMsg(requestError);
      },
    });
  }
}