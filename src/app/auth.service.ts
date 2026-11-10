import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { API_URL } from './config';
import { AuthResponse, Role, User } from './models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  user = signal<User | null>(this.readUser());
  token = signal<string | null>(localStorage.getItem('hv_token'));
  isLoggedIn = computed(() => !!this.token() && !!this.user());
  role = computed<Role | null>(() => this.user()?.role ?? null);

  private readUser(): User | null {
    try {
      const raw = localStorage.getItem('hv_user');
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }

  private save(res: AuthResponse) {
    if (!res.token) return;
    localStorage.setItem('hv_token', res.token);
    localStorage.setItem('hv_user', JSON.stringify(res.user));
    this.token.set(res.token);
    this.user.set(res.user);
  }

  /** Remove the session on this device (no API call). */
  clear() {
    localStorage.removeItem('hv_token');
    localStorage.removeItem('hv_user');
    this.token.set(null);
    this.user.set(null);
  }

  refreshUser() {
    if (!this.token()) return;

    this.http.get<User>(`${API_URL}/me`).subscribe({
      next: (user) => {
        localStorage.setItem('hv_user', JSON.stringify(user));
        this.user.set(user);
      },
      error: () => {},
    });
  }

  login(email: string, password: string, role: Role) {
    return this.http
      .post<AuthResponse>(`${API_URL}/login`, { email, password, role })
      .pipe(tap((res) => this.save(res)));
  }

  checkRegistrationEmail(email: string) {
    return this.http.post<{ available: boolean; message: string | null }>(`${API_URL}/register/check-email`, { email });
  }

  register(payload: {
    name: string;
    email: string;
    phone: string;
    role: Role;
    password: string;
    password_confirmation: string;
    qualification_photo?: File;
  }) {
    const formData = new FormData();
    formData.append('name', payload.name);
    formData.append('email', payload.email);
    formData.append('phone', payload.phone);
    formData.append('role', payload.role);
    formData.append('password', payload.password);
    formData.append('password_confirmation', payload.password_confirmation);
    if (payload.qualification_photo) {
      formData.append('qualification_photo', payload.qualification_photo);
    }

    return this.http.post<AuthResponse>(`${API_URL}/register`, formData).pipe(tap((res) => this.save(res)));
  }

  logout() {
    const finish = () => {
      this.clear();
      this.router.navigate(['/']);
    };
    this.http.post(`${API_URL}/logout`, {}).subscribe({ next: finish, error: finish });
  }

  /** Where each role lands after login. */
  homeFor(role: Role | null): string {
    if (role === 'admin') return '/admin';
    if (role === 'guide') return '/guide';
    return '/trails';
  }
}