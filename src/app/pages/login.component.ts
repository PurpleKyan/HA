import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import { Role } from '../models';
import { ToastService } from '../toast.service';
import { errMsg } from '../utils';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <section class="auth-wrap">
      <div class="auth-card">
        <div class="auth-head">
          <h1 class="h-md">Welcome back</h1>
          <p class="muted">Choose how you want to log in.</p>
        </div>

        <div class="role-pick">
          @for (r of roles; track r.key) {
            <button type="button" class="role-opt" [class.on]="role === r.key" (click)="choose(r.key)">
              <span><img [src]="r.icon" alt="" /></span>
              <b>{{ r.title }}</b>
            </button>
          }
        </div>
        <p class="role-desc">{{ current().desc }}</p>

        <form (ngSubmit)="submit()" #f="ngForm" autocomplete="off" data-1p-ignore data-lpignore="true">
          <div class="field">
            <label for="email">Email</label>
            <input id="email" name="login_email_address" type="email" [(ngModel)]="email" #emailField="ngModel" [readOnly]="emailReadonly" (focus)="enableEmail()" (click)="enableEmail()" required pattern="[^A-Z@ ]+@gmail\.com" [class.input-invalid]="hasUppercaseEmail() || (emailField.invalid && (emailField.dirty || emailField.touched))" placeholder="example@gmail.com" autocomplete="off" autocapitalize="none" spellcheck="false" data-1p-ignore data-lpignore="true" />
            @if (hasUppercaseEmail()) {
              <small class="field-error">Email must use lowercase letters only.</small>
            } @else if (emailField.invalid && (emailField.dirty || emailField.touched)) {
              <small class="field-error">Enter a lowercase Gmail address ending in &#64;gmail.com.</small>
            } @else {
              <small class="muted">Use a lowercase email address ending in &#64;gmail.com.</small>
            }
          </div>
          <div class="field">
            <label for="password">Password</label>
            <div class="pw">
              <input id="password" name="login_account_password" [type]="show ? 'text' : 'password'" [(ngModel)]="password" [readOnly]="passwordReadonly" (focus)="enablePassword()" (click)="enablePassword()" required placeholder="Your password" autocomplete="off" data-1p-ignore data-lpignore="true" />
              <button type="button" class="pw-btn" (click)="show = !show">{{ show ? 'Hide' : 'Show' }}</button>
            </div>
          </div>

          <a class="auth-forgot" routerLink="/forgot-password">Forgot password?</a>

          @if (error) {
            <div class="alert alert-error">{{ error }}</div>
          }

          <button class="btn btn-primary btn-block" type="submit" [disabled]="loading || !f.valid || hasUppercaseEmail()">
            {{ loading ? 'Logging in…' : 'Log in as ' + current().title }}
          </button>
        </form>

        @if (role !== 'admin') {
          <p class="auth-foot">
            New here? <a routerLink="/register" [queryParams]="{ role: role }">Create an account</a>
          </p>
        }
      </div>
    </section>
  `,
})
export class LoginComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  roles: { key: Role; icon: string; title: string; desc: string }[] = [
    { key: 'hiker', icon: '/hiker.png', title: 'Hiker', desc: 'Browse trails, get recommendations and send booking requests.' },
    { key: 'guide', icon: '/tour-guide.png', title: 'Guide', desc: 'Manage your trails and approve, decline or complete requests.' },
    { key: 'admin', icon: '/administrator.png', title: 'Admin', desc: 'Verify listings, manage users and monitor all activity.' },
  ];

  role: Role = 'hiker';
  email = '';
  password = '';
  show = false;
  loading = false;
  error = '';
  emailReadonly = true;
  passwordReadonly = true;

  ngOnInit() {
    this.email = '';
    this.password = '';
    const r = this.route.snapshot.queryParamMap.get('role');
    if (r === 'hiker' || r === 'guide' || r === 'admin') this.role = r;
    if (this.auth.isLoggedIn()) this.router.navigate([this.auth.homeFor(this.auth.role())]);
  }

  enableEmail(): void {
    this.emailReadonly = false;
  }

  enablePassword(): void {
    this.passwordReadonly = false;
  }

  hasUppercaseEmail(): boolean {
    return /[A-Z]/.test(this.email);
  }

  current() {
    return this.roles.find((r) => r.key === this.role) || this.roles[0];
  }

  choose(r: Role) {
    this.role = r;
    this.error = '';
  }

  submit() {
    if (this.hasUppercaseEmail()) return;

    this.error = '';
    this.loading = true;
    this.auth.login(this.email.trim(), this.password, this.role).subscribe({
      next: (res) => {
        this.loading = false;
        this.toast.ok(`Welcome, ${res.user.name}!`);
        this.router.navigate([this.auth.homeFor(res.user.role)]);
      },
      error: (e) => {
        this.loading = false;
        this.error = errMsg(e);
      },
    });
  }
}