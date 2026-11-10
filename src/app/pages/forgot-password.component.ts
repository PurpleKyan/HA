import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../api.service';
import { errMsg } from '../utils';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, RouterLink],
  styles: [`
    .auth-wrap { min-height: calc(100vh - 140px); padding: 48px 20px; }
    .recovery-card { display: grid; grid-template-columns: .9fr 1.1fr; width: min(100%, 980px); min-height: 570px; overflow: hidden; border: 1px solid rgba(255,255,255,.7); border-radius: 24px; background: #fffefa; box-shadow: 0 30px 80px rgba(8,31,20,.32); }
    .visual { position: relative; display: flex; flex-direction: column; justify-content: space-between; min-height: 100%; padding: 36px; overflow: hidden; color: #fffefa; background: linear-gradient(180deg, rgba(10,40,27,.28), rgba(8,34,24,.92)), url('/mt-kampalili.jpg') center / cover; }
    .brand { display: flex; align-items: center; gap: 11px; color: #fffefa; font-family: 'Fraunces', Georgia, serif; font-size: 1.3rem; font-weight: 700; cursor: default; pointer-events: none; user-select: none; }
    .brand-mark { display: block; width: 48px; height: 48px; flex: 0 0 48px; }
    .brand-mark svg { display: block; width: 100%; height: 100%; }
    .visual-copy { position: relative; z-index: 1; max-width: 360px; margin: auto 0; padding: 64px 0; }
    .eyebrow { margin-bottom: 14px; color: #f4cb76; font-size: .73rem; font-weight: 800; letter-spacing: .17em; text-transform: uppercase; }
    .visual h2 { margin: 0 0 14px; color: #fffefa; font-family: 'Fraunces', Georgia, serif; font-size: clamp(2rem, 3.2vw, 2.7rem); line-height: 1.12; }
    .visual-copy p { margin: 0; color: rgba(255,254,250,.8); line-height: 1.75; }
    .form-panel { display: flex; flex-direction: column; justify-content: center; padding: 52px clamp(32px, 6vw, 72px); }
    .back-link { display: inline-flex; align-items: center; gap: 8px; align-self: flex-start; margin-bottom: 46px; color: #52665a; font-size: .88rem; font-weight: 700; }
    .back-link:hover { color: var(--pine); text-decoration: none; }
    .back-link svg { width: 17px; height: 17px; }
    .form-content { width: 100%; max-width: 390px; margin: 0 auto; }
    .form-content h1 { margin: 0 0 12px; color: var(--ink); font-family: 'Fraunces', Georgia, serif; font-size: clamp(2rem, 4vw, 2.55rem); line-height: 1.12; }
    .intro { margin: 0 0 30px; color: var(--muted); line-height: 1.7; }
    .field { margin-bottom: 20px; }
    .field label { margin-bottom: 8px; color: #34483b; font-size: .88rem; font-weight: 750; }
    .email-wrap { position: relative; }
    .email-wrap svg { position: absolute; top: 50%; left: 15px; width: 19px; height: 19px; color: #75877b; transform: translateY(-50%); pointer-events: none; }
    .email-wrap input { min-height: 54px; padding: 12px 14px 12px 46px; border-radius: 12px; }
    .btn-block { min-height: 54px; justify-content: center; border-radius: 12px; font-size: .98rem; }
    .secure-note { display: flex; align-items: flex-start; gap: 9px; margin: 20px 0 0; color: #718076; font-size: .77rem; line-height: 1.55; }
    .secure-note svg { flex: 0 0 auto; width: 16px; height: 16px; margin-top: 1px; color: var(--moss); }
    .alert { margin: 0 0 18px; border-radius: 11px; }
    .success-icon { display: grid; width: 54px; height: 54px; margin-bottom: 22px; place-items: center; border-radius: 17px; background: #eaf3e9; color: var(--pine); }
    .success-icon svg { width: 27px; height: 27px; }
    .success-copy { margin: 0 0 20px; color: var(--muted); line-height: 1.7; overflow-wrap: anywhere; }
    .success-copy strong { color: var(--ink); }
    .success-tip { margin: 0 0 26px; padding: 14px 16px; border: 1px solid #e4e9df; border-radius: 12px; background: #f6f8f2; color: #58675d; font-size: .84rem; line-height: 1.6; }
    .text-button { display: block; margin: 18px auto 0; padding: 6px; border: 0; background: transparent; color: var(--pine); font: inherit; font-size: .88rem; font-weight: 750; cursor: pointer; }
    .text-button:hover { text-decoration: underline; }
    @media (max-width: 760px) {
      .auth-wrap { min-height: calc(100vh - 120px); padding: 22px 14px; }
      .recovery-card { grid-template-columns: 1fr; min-height: 0; border-radius: 20px; }
      .visual { min-height: 190px; padding: 22px 24px; }
      .visual-copy { max-width: 460px; padding: 26px 0 10px; }
      .visual h2 { max-width: 370px; margin-bottom: 7px; font-size: 1.8rem; }
      .visual-copy p { max-width: 430px; font-size: .88rem; }
      .brand-mark { width: 42px; height: 42px; flex-basis: 42px; }
      .form-panel { padding: 25px 24px 30px; }
      .back-link { margin-bottom: 30px; }
    }
  `],
  template: `
    <section class="auth-wrap">
      <div class="recovery-card">
        <aside class="visual" aria-label="HikeVista password recovery">
          <div class="brand">
            <span class="brand-mark" aria-hidden="true">
              <svg viewBox="0 0 48 48" aria-hidden="true">
                <defs>
                  <linearGradient id="recovery-logo-bg" x1="7" y1="3" x2="42" y2="47" gradientUnits="userSpaceOnUse"><stop stop-color="#245b40"/><stop offset=".55" stop-color="#174431"/><stop offset="1" stop-color="#0b3025"/></linearGradient>
                  <linearGradient id="recovery-logo-sky" x1="24" y1="6" x2="24" y2="37" gradientUnits="userSpaceOnUse"><stop stop-color="#397456"/><stop offset=".62" stop-color="#d7a85a"/><stop offset="1" stop-color="#f0c77b"/></linearGradient>
                  <linearGradient id="recovery-logo-far" x1="18" y1="15" x2="28" y2="37" gradientUnits="userSpaceOnUse"><stop stop-color="#9bb69a"/><stop offset="1" stop-color="#50755a"/></linearGradient>
                  <linearGradient id="recovery-logo-peak" x1="18" y1="15" x2="34" y2="42" gradientUnits="userSpaceOnUse"><stop stop-color="#f8f2de"/><stop offset=".48" stop-color="#dce4ce"/><stop offset="1" stop-color="#91ad8a"/></linearGradient>
                  <linearGradient id="recovery-logo-shadow" x1="27" y1="23" x2="39" y2="40" gradientUnits="userSpaceOnUse"><stop stop-color="#a8bb9c"/><stop offset="1" stop-color="#66866d"/></linearGradient>
                  <linearGradient id="recovery-logo-trail" x1="24" y1="24" x2="29" y2="42" gradientUnits="userSpaceOnUse"><stop stop-color="#fff4cc"/><stop offset="1" stop-color="#e8b955"/></linearGradient>
                  <clipPath id="recovery-logo-landscape"><rect x="3.5" y="3.5" width="41" height="41" rx="12"/></clipPath>
                </defs>
                <rect width="48" height="48" rx="14" fill="url(#recovery-logo-bg)"/>
                <g clip-path="url(#recovery-logo-landscape)">
                  <rect x="3.5" y="3.5" width="41" height="41" fill="url(#recovery-logo-sky)"/>
                  <circle cx="35.5" cy="13" r="4" fill="#fbe6a4" opacity=".92"/>
                  <circle cx="35.5" cy="13" r="6.5" fill="#fbe6a4" opacity=".13"/>
                  <path d="M4 31 12 22l4 4 7-10 10 13v8H4Z" fill="url(#recovery-logo-far)"/>
                  <path d="m7 39 13-23 7 10 4-6 13 19H7Z" fill="url(#recovery-logo-peak)"/>
                  <path d="m20 16 7 10-5-2-2 3-3-2-3 5 6-14Z" fill="#fffdf4"/>
                  <path d="m27 26 4-6 13 19H27l5-8-5-5Z" fill="url(#recovery-logo-shadow)"/>
                  <path d="M4 37c6-2 8-1 12 2s8 3 12 0 9-4 16-2v8H4Z" fill="#174431"/>
                  <path d="M27 27c-3 2-4 4-3 6 .8 1.6 3.2 1.6 3.8 3 .7 1.8-2.1 3.6-4.3 5.2" fill="none" stroke="url(#recovery-logo-trail)" stroke-width="1.7" stroke-linecap="round"/>
                  <path d="M20 17.5 22 14l2 3.5" fill="none" stroke="#fff8e6" stroke-opacity=".8" stroke-width=".7" stroke-linecap="round" stroke-linejoin="round"/>
                </g>
                <rect x=".65" y=".65" width="46.7" height="46.7" rx="14" fill="none" stroke="#f1ca70" stroke-opacity=".8" stroke-width="1.3"/>
                <path d="m9 8 1.2 2.4L13 11l-2.8.8L9 14l-1.1-2.2L5 11l2.9-.6L9 8Z" fill="#fff0bd" opacity=".9"/>
              </svg>
            </span>
            <span>HikeVista</span>
          </div>
          <div class="visual-copy">
            <div class="eyebrow">Account recovery</div>
            <h2>Your next trail is waiting.</h2>
            <p>A quick reset and you’ll be back to planning your next adventure.</p>
          </div>
        </aside>

        <div class="form-panel">
          <a class="back-link" routerLink="/login">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m14 18-6-6 6-6M8 12h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Back to login
          </a>

          <div class="form-content">
            @if (message) {
              <div class="success-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none"><path d="M4 7.5 12 13l8-5.5M5 5h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="m9 15 2 2 4-4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </div>
              <h1 id="recovery-title">Check your inbox</h1>
              <p class="success-copy" role="status">If an account exists for <strong>{{ email }}</strong>, a six-digit reset code is on its way.</p>
              <p class="success-tip">The code expires in 10 minutes. It can take a minute to arrive, so check your spam or junk folder too.</p>
              <a class="btn btn-primary btn-block" routerLink="/reset-password" [queryParams]="{ email: email }">Enter reset code</a>
              <button class="btn btn-primary btn-block" type="button" (click)="startOver()">Try another email</button>
            } @else {
              <h1 id="recovery-title">Forgot password?</h1>
              <p class="intro">No worries. Enter the email linked to your account and we’ll send you a six-digit reset code.</p>

              @if (error) {
                <div class="alert alert-error" role="alert">{{ error }}</div>
              }

              <form (ngSubmit)="submit()" #form="ngForm" autocomplete="off">
                <div class="field">
                  <label for="email">Email address</label>
                  <div class="email-wrap">
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.7"/><path d="m4 7 8 6 8-6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    <input id="email" name="email" type="email" [(ngModel)]="email" #emailField="ngModel" required email pattern="[a-z0-9._%+-]+@gmail\.com" placeholder="example@gmail.com" autocomplete="email" autocapitalize="none" spellcheck="false" />
                  </div>
                  @if (emailField.invalid && (emailField.dirty || emailField.touched)) {
                    <small class="field-error">Enter a valid Gmail address ending in &#64;gmail.com.</small>
                  }
                </div>
                <button class="btn btn-primary btn-block" type="submit" [disabled]="loading || !form.valid">
                  {{ loading ? 'Sending reset code…' : 'Send reset code' }}
                </button>
              </form>

              <p class="secure-note">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 10V7a5 5 0 0 1 10 0v3M6 10h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 14v3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
                For your security, we never reveal whether an email is registered.
              </p>
            }
          </div>
        </div>
      </div>
    </section>
  `,
})
export class ForgotPasswordComponent {
  private api = inject(ApiService);

  email = '';
  loading = false;
  message = '';
  error = '';

  startOver(): void {
    this.message = '';
  }

  submit(): void {
    this.loading = true;
    this.message = '';
    this.error = '';

    this.api.requestPasswordResetCode(this.email.trim()).subscribe({
      next: (response) => {
        this.loading = false;
        this.message = response.message;
      },
      error: (requestError) => {
        this.loading = false;
        this.error = errMsg(requestError);
      },
    });
  }
}