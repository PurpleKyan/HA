export type Role = 'hiker' | 'guide' | 'admin';

export const CATEGORIES = ['Mountain', 'Waterfall', 'Eco-Park'];
export const DIFFICULTIES = ['Easy', 'Moderate', 'Hard'];
export const TRIP_TYPES = ['Day Hike', 'Overnight'];
export const FEATURES = ['Scenic View', 'Camping', 'Swimming', 'Wildlife', 'Summit Climb', 'Family-Friendly', 'Cultural'];
export const BOOKING_STATUSES = ['Pending', 'Approved', 'Completed', 'Cancelled'];

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
  is_active?: boolean;
  guide_visible?: boolean;
  has_guide_qualification?: boolean;
  avg_rating?: number;
  review_count?: number;
  completed_bookings?: number;
  account_status?: 'pending' | 'approved' | 'rejected';
  spam_violation_count?: number;
  spam_validation_status?: 'clear' | 'review' | 'flagged' | 'approved' | 'rejected';
  spam_restriction_expires_at?: string | null;
  created_at?: string;
}

export interface AuthResponse {
  user: User;
  token?: string;
  account_status?: 'pending' | 'approved' | 'rejected';
  message?: string;
}

export interface Trail {
  id: number;
  user_id: number;
  name: string;
  location: string;
  category: string;
  difficulty: string;
  trip_type: string;
  description: string;
  elevation: number;
  distance_km: number;
  duration_hours: number;
  entrance_fee: number;
  guide_fee: number;
  permits?: string | null;
  max_daily_visitors: number;
  latitude?: number | null;
  longitude?: number | null;
  image_url?: string | null;
  photos?: TrailPhoto[];
  features?: string[] | null;
  safety_advisory?: string | null;
  lnt_notes?: string | null;
  status: string;
  is_active: boolean;
  avg_rating: number;
  reviews_count: number;
  owner?: { id: number; name: string; email?: string; phone?: string | null };
}

export interface TrailPhoto {
  id: string;
  trail_id: number;
  url: string;
  created_at: string;
}

export interface BookingLog {
  id: number;
  status: string;
  created_at: string;
}

export interface Review {
  id: number;
  booking_id: number;
  trail_id: number;
  rating: number;
  comment?: string | null;
  photos: string[] | null;
  created_at: string;
  user?: { id: number; name: string };
  trail?: { id: number; name: string };
}

export interface Booking {
  id: number;
  booking_code: string;
  user_id: number;
  guide_id?: number | null;
  trail_id: number;
  trek_date: string;
  group_size: number;
  itinerary?: string | null;
  special_requirements?: string | null;
  total_cost: number;
  status: string;
  created_at: string;
  trail?: Partial<Trail>;
  guide?: { id: number; name: string; phone?: string | null };
  user?: { id: number; name: string; email: string; phone?: string | null };
  logs?: BookingLog[];
  review?: Review | null;
}

export interface Recommendation {
  trail: Trail;
  estimated_cost: number;
  score: number;
  breakdown: { preference_match: number; budget_fit: number; rating_score: number };
}

export interface Report {
  total_bookings: number;
  total_visitors: number;
  completed_revenue: number;
  status_counts: Record<string, number>;
  by_trail: { trail: string; bookings: number; visitors: number }[];
  by_month: { month: string; bookings: number; visitors: number }[];
}

export interface AdminStats {
  users: { hikers: number; guides: number; admins: number };
  trails: { total: number; pending: number; verified: number; rejected: number };
  bookings: { total: number; pending: number; approved: number; completed: number; cancelled: number };
}