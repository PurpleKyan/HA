import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from './config';
import { AdminStats, Booking, Recommendation, Report, Review, Trail, TrailPhoto, User } from './models';

type TrailFilters = {
  search?: string;
  location?: string;
  category?: string;
  difficulty?: string;
  trip_type?: string;
  max_budget?: number | string;
  sort?: string;
};

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  requestPasswordResetCode(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${API_URL}/password/forgot`, { email });
  }

  resetPassword(payload: {
    email: string;
    code: string;
    password: string;
    password_confirmation: string;
  }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${API_URL}/password/reset`, payload);
  }

  trails(filters: TrailFilters = {}): Observable<Trail[]> {
    const params = new HttpParams({
      fromObject: Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== '' && value !== undefined)
      ),
    });
    return this.http.get<Trail[]>(`${API_URL}/trails`, { params });
  }

  locations(): Observable<string[]> {
    return this.http.get<string[]>(`${API_URL}/trails/locations`);
  }

  trail(id: number): Observable<Trail> {
    return this.http.get<Trail>(`${API_URL}/trails/${id}`);
  }

  guides(): Observable<User[]> {
    return this.http.get<User[]>(`${API_URL}/guides`);
  }

  trailReviews(id: number): Observable<Review[]> {
    return this.http.get<Review[]>(`${API_URL}/trails/${id}/reviews`);
  }

  recommend(payload: {
    budget: number;
    group_size: number;
    location: string | null;
    category: string | null;
    difficulty: string | null;
    trip_type: string | null;
    features: string[];
  }): Observable<Recommendation[]> {
    return this.http.post<Recommendation[]>(`${API_URL}/recommendations`, payload);
  }

  createBooking(payload: {
    trail_id: number;
    guide_id: number;
    trek_date: string;
    group_size: number;
    itinerary: string;
    special_requirements: string;
  }): Observable<Booking> {
    return this.http.post<Booking>(`${API_URL}/bookings`, payload);
  }

  myBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${API_URL}/bookings`);
  }

  cancelBooking(id: number): Observable<Booking> {
    return this.http.patch<Booking>(`${API_URL}/bookings/${id}/cancel`, {});
  }

  deleteCompletedBooking(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${API_URL}/bookings/${id}`);
  }

  reviewBooking(id: number, rating: number, comment: string, photos: File[] = []): Observable<Review> {
    const formData = new FormData();
    formData.append('rating', String(rating));
    if (comment.trim()) formData.append('comment', comment.trim());
    photos.slice(0, 5).forEach((photo) => formData.append('photos[]', photo));
    return this.http.post<Review>(`${API_URL}/bookings/${id}/review`, formData);
  }

  guideTrails(): Observable<Trail[]> {
    return this.http.get<Trail[]>(`${API_URL}/guide/trails`);
  }

  guideVisibility(): Observable<{ guide_visible: boolean }> {
    return this.http.get<{ guide_visible: boolean }>(`${API_URL}/guide/visibility`);
  }

  guideToggleVisibility(): Observable<{ guide_visible: boolean }> {
    return this.http.patch<{ guide_visible: boolean }>(`${API_URL}/guide/visibility/toggle`, {});
  }

  guideBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${API_URL}/guide/bookings`);
  }

  guideSetStatus(id: number, status: string): Observable<Booking> {
    return this.http.patch<Booking>(`${API_URL}/guide/bookings/${id}/status`, { status });
  }

  guideDeleteCompletedBooking(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${API_URL}/guide/bookings/${id}`);
  }

  guideReports(): Observable<Report> {
    return this.http.get<Report>(`${API_URL}/guide/reports`);
  }

  adminStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${API_URL}/admin/stats`);
  }

  adminReports(): Observable<Report> {
    return this.http.get<Report>(`${API_URL}/admin/reports`);
  }

  adminUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${API_URL}/admin/users`);
  }

  adminGuideQualificationPhoto(id: number): Observable<Blob> {
    return this.http.get(`${API_URL}/admin/users/${id}/guide-qualification`, { responseType: 'blob' });
  }

  adminReviews(): Observable<Review[]> {
    return this.http.get<Review[]>(`${API_URL}/admin/reviews`);
  }

  adminDeleteReview(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${API_URL}/admin/reviews/${id}`);
  }

  adminToggleUser(id: number): Observable<User> {
    return this.http.patch<User>(`${API_URL}/admin/users/${id}/toggle`, {});
  }

  adminDeleteUser(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${API_URL}/admin/users/${id}`);
  }

  adminFlaggedUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${API_URL}/admin/flagged-users`);
  }

  adminReviewValidation(id: number, status: 'clear' | 'approved' | 'flagged'): Observable<User> {
    return this.http.patch<User>(`${API_URL}/admin/users/${id}/validation`, { status });
  }

  adminReviewGuide(id: number, status: 'approved' | 'rejected'): Observable<User> {
    return this.http.patch<User>(`${API_URL}/admin/users/${id}/guide-review`, { status });
  }

  adminTrails(status: string): Observable<Trail[]> {
    const params = status ? new HttpParams().set('status', status) : undefined;
    return this.http.get<Trail[]>(`${API_URL}/admin/trails`, { params });
  }

  adminCreateTrail(payload: object): Observable<Trail> {
    return this.http.post<Trail>(`${API_URL}/admin/trails`, payload);
  }

  adminUpdateTrail(id: number, payload: {
    name: string;
    location: string;
    latitude: number | null;
    longitude: number | null;
    image_url: string | null;
    entrance_fee: number;
    guide_fee: number;
  }): Observable<Trail> {
    return this.http.patch<Trail>(`${API_URL}/admin/trails/${id}`, payload);
  }

  adminUpdateTrailPicture(id: number, file: File): Observable<Trail> {
    const formData = new FormData();
    formData.append('picture', file);
    return this.http.post<Trail>(`${API_URL}/admin/trails/${id}/picture`, formData);
  }

  adminUploadTrailPhotos(id: number, files: File[]): Observable<TrailPhoto[]> {
    const formData = new FormData();
    files.forEach((file) => formData.append('photos[]', file));
    return this.http.post<TrailPhoto[]>(`${API_URL}/admin/trails/${id}/photos`, formData);
  }

  adminDeleteTrailPhoto(trailId: number, photoId: string): Observable<{ message: string; photos: NonNullable<Trail['photos']> }> {
    return this.http.delete<{ message: string; photos: NonNullable<Trail['photos']> }>(
      `${API_URL}/admin/trails/${trailId}/photos/${photoId}`
    );
  }

  adminVerifyTrail(id: number, status: string): Observable<Trail> {
    return this.http.patch<Trail>(`${API_URL}/admin/trails/${id}/verify`, { status });
  }

  adminToggleTrailVisibility(id: number): Observable<Trail> {
    return this.http.patch<Trail>(`${API_URL}/admin/trails/${id}/visibility`, {});
  }

  adminBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${API_URL}/admin/bookings`);
  }
}