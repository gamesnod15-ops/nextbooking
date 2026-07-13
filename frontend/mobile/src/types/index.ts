// ─── Domain Types (mirrors backend DTOs) ────────────────────────────────────

export type AppRole = 'business' | 'customer';

export interface AuthState {
  accessToken: string | null;
  userId: string | null;
  role: string | null;
  tenantId: string | null;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
  avatarUrl: string | null;
  appRole: AppRole | null; // 'business' | 'customer'
}

export interface Business {
  id: string;
  name: string;
  slug: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  plan: 'starter' | 'business' | 'professional' | 'custom';
  isActive: boolean;
}

export interface Employee {
  id: string;
  fullName: string;
  phone?: string;
  email?: string;
  jobTitle?: string;
  avatarUrl?: string;
  isActive: boolean;
  services?: string[];
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
  category?: string;
  isActive: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  avatarUrl?: string;
  birthDate?: string;
  gender?: string;
  tags?: string[];
  isBlocked?: boolean;
  lastVisitAt?: string;
  totalVisits?: number;
  totalSpent?: number;
  createdAt: string;
}

export interface Appointment {
  id: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  serviceDurationMinutes: number;
  employeeName: string;
  startTime: string;
  endTime: string;
  price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  notes?: string;
  source: string;
  customerId?: string;
  serviceId?: string;
  employeeId?: string;
}

export interface Payment {
  id: string;
  customerName: string;
  amount: number;
  method: 'cash' | 'card' | 'transfer' | 'other';
  status: 'pending' | 'completed' | 'refunded' | 'cancelled';
  description?: string;
  transactionId?: string;
  createdAt: string;
}

export interface Campaign {
  id: string;
  title: string;
  description?: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageCount: number;
  maxUsage?: number;
}

export interface GiftCoupon {
  id: string;
  code: string;
  amount: number;
  remainingAmount: number;
  customerName?: string;
  isUsed: boolean;
  expiresAt?: string;
}

export interface Product {
  id: string;
  name: string;
  sku?: string;
  price: number;
  stock: number;
  category?: string;
  isActive: boolean;
}

export interface BusinessPackage {
  id: string;
  name: string;
  description?: string;
  price: number;
  sessions: number;
  durationDays?: number;
  services: string[];
  isActive: boolean;
}

export interface LoyaltyMember {
  id: string;
  customerName: string;
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  totalSpent: number;
  joinedAt: string;
}

export interface WaitingListEntry {
  id: string;
  customerName: string;
  customerPhone: string;
  preferredDate?: string;
  serviceId?: string;
  serviceName?: string;
  employeeId?: string;
  status: 'waiting' | 'notified' | 'confirmed' | 'booked';
  notes?: string;
  createdAt: string;
}

export interface QueueEntry {
  id: string;
  number: number;
  customerName: string;
  serviceName?: string;
  employeeName?: string;
  waitingMinutes: number;
  status: 'waiting' | 'in_service' | 'completed';
  estimatedWait?: number;
  calledAt?: string;
}

export interface Survey {
  id: string;
  title: string;
  description?: string;
  questions: number;
  responses: number;
  avgRating: number;
  isActive: boolean;
  createdAt: string;
}

export interface DashboardStats {
  todayAppointments: number;
  todayCompleted: number;
  todayCancelled: number;
  todayPending: number;
  todayRevenue: number;
  monthAppointments: number;
  monthRevenue: number;
  occupancyRate: number;
  totalCustomers: number;
  todayAppointmentList: TodayAppointment[];
  weeklyStats: WeeklyStat[];
  monthlyStats: MonthlyStat[];
}

export interface TodayAppointment {
  id: string;
  customerName: string;
  customerPhone?: string;
  serviceName: string;
  serviceDurationMinutes?: number;
  employeeName: string;
  startTime: string;
  endTime: string;
  status: string;
  price: number;
  notes?: string;
}

export interface WeeklyStat {
  day: string;
  appointments: number;
  revenue: number;
}

export interface MonthlyStat {
  month: string;
  appointments: number;
  revenue: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: 'appointment' | 'payment' | 'review' | 'system' | 'promotion' | 'message';
  isRead: boolean;
  createdAt: string;
  relatedId?: string;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone?: string;
  isMain: boolean;
  isActive: boolean;
  coordinates?: { lat: number; lng: number };
}

export interface Performance {
  employeeId: string;
  employeeName: string;
  avatarUrl?: string;
  appointmentCount: number;
  revenue: number;
  rating: number;
  cancellationRate: number;
}

export interface Receivable {
  id: string;
  customerName: string;
  description: string;
  amount: number;
  paidAmount?: number;
  dueDate: string;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  notes?: string;
  createdAt: string;
}

export interface Commission {
  id: string;
  employeeId?: string;
  employeeName: string;
  period: string;
  amount: number;
  status: 'pending' | 'paid';
  description?: string;
  notes?: string;
  createdAt?: string;
}

export interface Debt {
  id: string;
  customerId?: string;
  customerName?: string;
  creditorName?: string;
  description: string;
  amount: number;
  remainingAmount?: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  notes?: string;
  createdAt?: string;
}

export interface Advertisement {
  id: string;
  title: string;
  description?: string;
  type?: 'banner' | 'popup' | 'video';
  targetUrl?: string;
  imageUrl?: string;
  startDate: string;
  endDate: string;
  isActive?: boolean;
  clicks?: number;
  views?: number;
  position?: string;
  platform?: 'google' | 'facebook' | 'instagram' | 'internal';
  status?: 'active' | 'paused' | 'ended' | 'pending';
  budget?: number;
  spent?: number;
  impressions?: number;
}

export interface Coupon {
  id: string;
  name: string;
  code?: string;
  description?: string;
  type: 'percentage' | 'fixed';
  value: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
  usageCount: number;
  usageLimit?: number;
  scope: 'all' | 'service' | 'package';
  minAmount?: number;
}

export interface Review {
  id: string;
  authorName: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface PaymentCard {
  id: string;
  brand: string;
  lastFour: string;
  expiry: string;
  cardHolder: string;
  default: boolean;
}

export interface Form {
  id: string;
  title: string;
  fields: number;
  responses: number;
  isActive: boolean;
  createdAt: string;
}

export interface CustomerProfile {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  avatarUrl?: string;
  loyaltyPoints: number;
  favoriteBusinesses?: string[];
}
