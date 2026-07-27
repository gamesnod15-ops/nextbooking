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
  name: string;
  phone?: string;
  email?: string;
  title?: string;
  bio?: string;
  avatarUrl?: string;
  isActive: boolean;
  acceptsOnlineBookings?: boolean;
  serviceIds?: string[];
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
  customerEmail?: string | null;
  customerCity?: string | null;
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
  appointmentId: string;
  customerName: string;
  serviceName: string;
  provider: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'partiallyRefunded';
  paidAt?: string;
  createdAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  discountType: 'percentage' | 'fixedAmount';
  discountValue: number;
  startDate: string;
  endDate: string;
  status: 'draft' | 'active' | 'paused' | 'ended';
  usageCount: number;
  usageLimit?: number;
}

export interface GiftCoupon {
  id: string;
  code: string;
  amount: number;
  recipientName: string;
  recipientEmail?: string;
  purchasedBy: string;
  purchaseDate: string;
  expiryDate?: string;
  usedAmount: number;
  status: 'active' | 'used' | 'expired';
  message?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  category?: string;
  barcode?: string;
  salePrice: number;
  costPrice?: number;
  stockQuantity: number;
  minStockLevel: number;
  unit?: string;
  isActive: boolean;
  isLowStock?: boolean;
}

export interface PackageItem {
  serviceId: string;
  serviceName: string;
  quantity: number;
}

export interface BusinessPackage {
  id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  validityDays: number;
  isActive: boolean;
  imageUrl?: string;
  items: PackageItem[];
}

export interface LoyaltyMember {
  id: string;
  customerId: string;
  name: string;
  phone: string;
  points: number;
  totalSpent: number;
  visits: number;
  tierId: string;
  joinedAt: string;
  lastVisit?: string;
}

export interface LoyaltyTier {
  id: string;
  name: string;
  minPoints: number;
  multiplier: number;
  color: string;
  iconName: string;
  benefits: string[];
  sortOrder: number;
}

export interface WaitingListEntry {
  id: string;
  customerName: string;
  customerPhone: string;
  preferredDate?: string;
  serviceId?: string;
  serviceName?: string;
  employeeId?: string;
  status: 'waiting' | 'notified' | 'confirmed' | 'booked' | 'cancelled';
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
  status: 'waiting' | 'in_service' | 'completed' | 'cancelled' | 'no_show';
  estimatedWait?: number;
  calledAt?: string;
}

/** One customer's post-appointment satisfaction feedback. */
export interface Survey {
  id: string;
  customerName?: string;
  rating: number;
  comment?: string;
  isApproved: boolean;
  appointmentId?: string;
  serviceName?: string;
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
  monthAppointmentsTrendPercent: number;
  todayAppointmentList: TodayAppointment[];
  weeklyStats: WeeklyStat[];
  monthlyStats: MonthlyStat[];
  recentActivities: RecentActivity[];
}

export interface RecentActivity {
  type: 'appointmentCreated' | 'appointmentCancelled' | 'customerAdded';
  title: string;
  subtitle: string;
  occurredAt: string;
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
  completed: number;
  cancelled: number;
  pending: number;
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
  isMainBranch: boolean;
  isActive: boolean;
  coordinates?: { lat: number; lng: number };
}

export interface Performance {
  employeeId: string;
  employeeName: string;
  title?: string | null;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  totalRevenue: number;
  completionRate: number;
  avgDailyAppointments: number;
}

export interface ReceivableInstallment {
  id: string;
  number: number;
  amount: number;
  dueDate: string;
  isPaid: boolean;
  paidAt?: string | null;
}

export interface Receivable {
  id: string;
  customerName: string;
  customerPhone?: string | null;
  description?: string | null;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  status: 'open' | 'partiallyPaid' | 'paid' | 'overdue';
  installmentCount: number;
  installments: ReceivableInstallment[];
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
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixedAmount';
  discountValue: number;
  minimumOrderAmount?: number;
  expiresAt?: string;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
  createdAt: string;
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
