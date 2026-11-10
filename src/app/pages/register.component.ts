import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../auth.service';
import { Role } from '../models';
import { AppIconComponent } from '../shared/app-icon.component';
import { ToastService } from '../toast.service';
import { errMsg } from '../utils';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, AppIconComponent],
  template: `
    <section class="auth-wrap">
      <div class="auth-card">
        <div class="auth-head">
          <h1 class="h-md">Create your account</h1>
          <p class="muted">Join HikeVista: TrailQuest.</p>
        </div>

        <div class="role-pick two">
          <button type="button" class="role-opt" [class.on]="role === 'hiker'" (click)="setRole('hiker')">
            <span><app-icon name="hiking" /></span><b>I'm a Hiker</b>
          </button>
          <button type="button" class="role-opt" [class.on]="role === 'guide'" (click)="setRole('guide')">
            <span><app-icon name="users" /></span><b>I'm a Guide / Officer</b>
          </button>
        </div>

        <form (ngSubmit)="submit()" #f="ngForm" autocomplete="off" data-1p-ignore data-lpignore="true">
          <div class="field">
            <label for="name">Full name</label>
            <input id="name" name="hikevista_registration_identity_92841" [(ngModel)]="name" #nameField="ngModel" required maxlength="255" pattern="[^0-9]+" [class.input-invalid]="nameField.invalid && (nameField.dirty || nameField.touched)" autocomplete="off" autocapitalize="words" spellcheck="false" aria-autocomplete="none" data-1p-ignore data-lpignore="true" />
            @if (nameField.invalid && (nameField.dirty || nameField.touched)) {
              <small class="field-error">Full name must not contain numbers.</small>
            }
          </div>
          <div class="form-grid">
            <div class="field">
              <label for="email">Email</label>
              <input id="email" name="register_email_address" type="email" [(ngModel)]="email" (ngModelChange)="onEmailChanged($event)" #emailField="ngModel" required pattern="[^A-Z@ ]+@gmail\.com" [class.input-invalid]="(emailField.invalid && (emailField.dirty || emailField.touched)) || emailAlreadyRegistered" placeholder="example@gmail.com" autocomplete="off" autocapitalize="none" spellcheck="false" data-1p-ignore data-lpignore="true" />
              @if (emailField.invalid && (emailField.dirty || emailField.touched)) {
                <small class="field-error">Enter a lowercase email address ending in &#64;gmail.com.</small>
              } @else if (emailAlreadyRegistered) {
                <small class="field-error">{{ emailCheckMessage }}</small>
              } @else if (emailCheckLoading) {
                <small class="muted">Checking email…</small>
              } @else if (emailCheckError) {
                <small class="field-error">{{ emailCheckError }}</small>
              } @else {
                <small class="muted">Use a lowercase email address ending in &#64;gmail.com.</small>
              }
            </div>
            <div class="field">
              <label for="phone">Phone (optional)</label>
              <input id="phone" name="register_phone_number" type="tel" [(ngModel)]="phone" #phoneField="ngModel" placeholder="09XXXXXXXXX" maxlength="11" pattern="09[0-9]{9}" autocomplete="off" inputmode="numeric" (input)="onPhoneInput($event)" aria-describedby="phone-hint" data-1p-ignore data-lpignore="true" />
              <small id="phone-hint" class="muted">Enter 11 digits starting with 09.</small>
              @if (phoneField.invalid && (phoneField.dirty || phoneField.touched)) {
                <small class="field-error">Enter exactly 11 digits starting with 09.</small>
              }
            </div>
          </div>
          <div class="form-grid">
            <div class="field">
              <label for="password">Password</label>
              <input id="password" name="register_new_password" type="password" [(ngModel)]="password" required minlength="8" maxlength="8" placeholder="Exactly 8 characters" autocomplete="new-password" data-1p-ignore data-lpignore="true" />
              <small class="muted">Password must be exactly 8 characters.</small>
            </div>
            <div class="field">
              <label for="confirm">Confirm password</label>
              <input id="confirm" name="register_confirm_password" type="password" [(ngModel)]="confirm" required maxlength="8" placeholder="Repeat password (8 characters)" autocomplete="new-password" data-1p-ignore data-lpignore="true" />
            </div>
          </div>

          @if (role === 'guide') {
            <div class="field guide-qualification-field">
              <label for="qualification-photo">Proof of guide qualification <span>(required)</span></label>
              <input id="qualification-photo" type="file" accept="image/jpeg,image/png,image/webp" required (change)="onQualificationPhotoSelected($event)" />
              <small class="muted">Upload a clear photo of your guide accreditation or qualification certificate. JPG, PNG, or WebP, up to 5 MB. Only administrators can view it during review.</small>
              @if (qualificationPhotoPreview) {
                <img class="guide-qualification-preview" [src]="qualificationPhotoPreview" alt="Preview of your qualification photo" />
              }
            </div>
          }

          @if (error) {
            <div class="alert alert-error">{{ error }}</div>
          }

          <button class="btn btn-primary btn-block" type="submit" [disabled]="loading || !f.valid || emailAlreadyRegistered || emailCheckLoading || (role === 'guide' && !qualificationPhoto)">
            {{ loading ? 'Creating account…' : 'Create account' }}
          </button>
        </form>

        <p class="auth-foot">
          Already have an account? <a routerLink="/login" [queryParams]="{ role: role }">Log in</a>
        </p>
      </div>
    </section>
  `,
})
export class RegisterComponent implements OnDestroy, OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  role: Role = 'hiker';
  name = '';
  email = '';
  phone = '';
  password = '';
  confirm = '';
  qualificationPhoto: File | null = null;
  qualificationPhotoPreview = '';
  loading = false;
  error = '';
  emailAlreadyRegistered = false;
  emailCheckLoading = false;
  emailCheckError = '';
  emailCheckMessage = '';
  private emailCheckTimer: ReturnType<typeof setTimeout> | null = null;
  private emailCheckSubscription: Subscription | null = null;

  ngOnInit() {
    this.name = '';
    this.email = '';
    this.phone = '';
    this.password = '';
    this.confirm = '';
    const r = this.route.snapshot.queryParamMap.get('role');
    if (r === 'hiker' || r === 'guide') this.role = r;
  }

  ngOnDestroy() {
    if (this.emailCheckTimer) clearTimeout(this.emailCheckTimer);
    this.emailCheckSubscription?.unsubscribe();
    this.clearQualificationPhoto();
  }

  onEmailChanged(value: string) {
    if (this.emailCheckTimer) clearTimeout(this.emailCheckTimer);
    this.emailCheckSubscription?.unsubscribe();
    this.emailCheckLoading = false;
    this.emailAlreadyRegistered = false;
    this.emailCheckError = '';
    this.emailCheckMessage = '';

    const email = value.trim();
    if (!/^[^A-Z@ ]+@gmail\.com$/.test(email)) return;

    this.emailCheckTimer = setTimeout(() => {
      this.emailCheckLoading = true;
      this.emailCheckSubscription = this.auth.checkRegistrationEmail(email).subscribe({
        next: (result) => {
          if (email !== this.email.trim()) return;
          this.emailCheckLoading = false;
          this.emailAlreadyRegistered = !result.available;
          this.emailCheckMessage = result.message ?? '';
        },
        error: (e) => {
          if (email !== this.email.trim()) return;
          this.emailCheckLoading = false;
          this.emailCheckError = errMsg(e);
        },
      });
    }, 350);
  }

  setRole(role: Role) {
    this.role = role;
    if (role !== 'guide') this.clearQualificationPhoto();
  }

  onQualificationPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const photo = input.files?.[0] ?? null;
    if (!photo) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(photo.type) || photo.size > 5 * 1024 * 1024) {
      this.clearQualificationPhoto();
      input.value = '';
      this.error = 'Choose a JPG, PNG, or WebP image no larger than 5 MB.';
      return;
    }

    this.clearQualificationPhoto();
    this.qualificationPhoto = photo;
    this.qualificationPhotoPreview = URL.createObjectURL(photo);
    this.error = '';
  }

  onPhoneInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 11);
    if (input.value !== digits) input.value = digits;
    this.phone = digits;
  }

  private clearQualificationPhoto() {
    if (this.qualificationPhotoPreview) URL.revokeObjectURL(this.qualificationPhotoPreview);
    this.qualificationPhoto = null;
    this.qualificationPhotoPreview = '';
  }

  submit() {
    this.error = '';
    if (this.role === 'guide' && !this.qualificationPhoto) {
      this.error = 'Upload a photo of your guide qualification before creating your account.';
      return;
    }
    const phoneDigits = this.phone.trim();
    if (phoneDigits && !/^09\d{9}$/.test(phoneDigits)) {
      this.error = 'Enter exactly 11 digits starting with 09.';
      return;
    }
    if (this.password !== this.confirm) {
      this.error = 'Passwords do not match.';
      return;
    }
    this.loading = true;
    this.auth
      .register({
        name: this.name.trim(),
        email: this.email.trim(),
        phone: phoneDigits,
        role: this.role,
        password: this.password,
        password_confirmation: this.confirm,
        ...(this.qualificationPhoto ? { qualification_photo: this.qualificationPhoto } : {}),
      })
      .subscribe({
        next: (res) => {
          this.loading = false;
          if (res.account_status === 'pending') {
            this.toast.ok('Guide account created. Waiting for administrator approval.');
            this.router.navigate(['/login'], { queryParams: { role: 'guide', pending: '1' } });
            return;
          }
          this.toast.ok('Account created. Welcome to HikeVista!');
          this.router.navigate([this.auth.homeFor(res.user.role)]);
        },
        error: (e) => {
          this.loading = false;
          this.error = errMsg(e);
        },
      });
  }
}