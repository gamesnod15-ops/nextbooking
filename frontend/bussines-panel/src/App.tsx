import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '@/store'
import React, { useEffect, useRef, useState, useCallback } from 'react'
import { setCredentials } from '@/store/slices/authSlice'
import api from '@/lib/api'
import { normalizePlanId, planAllows } from '@/config/plans'
import { LoginPage } from '@/pages/auth/LoginPage'
import { OAuthCallbackPage } from '@/pages/auth/OAuthCallbackPage'
import { CompleteRegistrationPage } from '@/pages/auth/CompleteRegistrationPage'
import { OnboardingWizardPage } from '@/pages/onboarding/OnboardingWizardPage'
import { UserDashboardPage } from '@/pages/user/UserDashboardPage'
import { ToastContainer } from '@/components/ui/Toast'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { AppointmentsPage } from '@/pages/appointments/AppointmentsPage'
import { ServicesPage } from '@/pages/services/ServicesPage'
import { EmployeesPage } from '@/pages/employees/EmployeesPage'
import { CustomersPage } from '@/pages/customers/CustomersPage'
import { SettingsPage } from '@/pages/settings/SettingsPage'
import { SupportPage } from '@/pages/support/SupportPage'
import { CalendarPage } from '@/pages/calendar/CalendarPage'
import { PaymentsPage } from '@/pages/payments/PaymentsPage'
import { ReportsPage } from '@/pages/reports/ReportsPage'
import { PackagesPage } from '@/pages/packages/PackagesPage'
import { PluginsPage } from '@/pages/plugins/PluginsPage'
import { NotificationsPage } from '@/pages/notifications/NotificationsPage'
import { CampaignsPage } from '@/pages/campaigns/CampaignsPage'
import { GiftCouponsPage } from './pages/gift-coupons/GiftCouponsPage'
import { DiscountsPage } from '@/pages/discounts/DiscountsPage'
import { ChatbotPage } from '@/pages/chatbot/ChatbotPage'
import { FormsPage } from '@/pages/forms/FormsPage'
import { ErrorMonitorPage } from '@/pages/error-monitor/ErrorMonitorPage'
import { MapsPage } from '@/pages/maps/MapsPage'
import { WalkinQueuePage } from '@/pages/walkin-queue/WalkinQueuePage'
import { WaitingListPage } from '@/pages/waiting-list/WaitingListPage'
import { LoyaltyPage } from '@/pages/loyalty/LoyaltyPage'
import { SocialMediaPage } from '@/pages/social-media/SocialMediaPage'
import { SurveysPage } from '@/pages/surveys/SurveysPage'
import { ProductsPage } from '@/pages/products/ProductsPage'
import { ReceivablesPage } from '@/pages/receivables/ReceivablesPage'
import { PerformancePage } from '@/pages/performance/PerformancePage'
import { CommissionsPage } from '@/pages/commissions/CommissionsPage'
import { DebtPage } from '@/pages/debts/DebtPage'
import { BranchesPage } from '@/pages/branches/BranchesPage'
import { SubscriptionPage } from '@/pages/subscription/SubscriptionPage'
import { AdvertisementsPage } from '@/pages/advertisements/AdvertisementsPage'
import { WhatsAppBotPage } from '@/pages/whatsapp-bot/WhatsAppBotPage'
import { RecommendationsPage } from '@/pages/recommendations/RecommendationsPage'
import { NoShowPredictionPage } from '@/pages/no-show-prediction/NoShowPredictionPage'
import { DepositsPage } from '@/pages/deposits/DepositsPage'
import { SmartSchedulePage } from '@/pages/smart-schedule/SmartSchedulePage'
import { ErrorBoundary } from '@/components/error/ErrorBoundary'
import { GlobalSearch } from '@/components/search/GlobalSearch'
import { FeedbackWidget } from '@/components/feedback/FeedbackWidget'
import { PreloadScreen } from '@/components/PreloadScreen'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { accessToken, role } = useSelector((s: RootState) => s.auth)
  const allowed = ['business', 'tenant_admin']
  return accessToken && role && allowed.includes(role) ? <>{children}</> : <Navigate to="/login" replace />
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const accessToken = useSelector((s: RootState) => s.auth.accessToken)
  return accessToken ? <>{children}</> : <Navigate to="/login" replace />
}

/** Reads ?autologin=TOKEN&userId=...&role=...&tenantId=...&fullName=... from URL
 *  and stores credentials so the user lands directly on the dashboard. */

function AutoLoginHandler() {
  const dispatch  = useDispatch();

  useEffect(() => {
    const params   = new URLSearchParams(window.location.search);
    const token    = params.get('autologin');
    if (!token) return;

    dispatch(setCredentials({
      accessToken: token,
      userId:      params.get('userId')   ?? undefined,
      role:        params.get('role')     ?? undefined,
      tenantId:    params.get('tenantId') ?? undefined,
      fullName:    params.get('fullName') ?? undefined,
    }));
    window.history.replaceState({}, '', '/');
    window.location.href = '/dashboard';
  }, []);

  return null;
}

/** First-login setup gate: if the business has no services yet (and the wizard
 *  hasn't been completed/skipped), redirect to /onboarding. Existing tenants
 *  with data get flagged as done automatically and are never interrupted. */
function OnboardingGate() {
  const { accessToken, role, tenantId } = useSelector((s: RootState) => s.auth)
  const navigate = useNavigate()
  const location = useLocation()
  const checked = useRef(false)

  useEffect(() => {
    if (!accessToken || !role || !['business', 'tenant_admin'].includes(role)) return
    if (checked.current) return
    const key = `onboarding_done_${tenantId ?? 'default'}`
    if (localStorage.getItem(key)) return
    if (location.pathname.startsWith('/onboarding') || location.pathname.startsWith('/login')) return

    checked.current = true
    api.get<{ totalCount: number }>('/services', { params: { pageNumber: 1, pageSize: 1 } })
      .then((r) => {
        if ((r.data?.totalCount ?? 0) > 0) {
          localStorage.setItem(key, '1')
        } else {
          navigate('/onboarding', { replace: true })
        }
      })
      .catch(() => { checked.current = false })
  }, [accessToken, role, tenantId, location.pathname, navigate])

  return null
}

function ModuleRoute({ moduleId, children }: { moduleId: string; children: React.ReactNode }) {
  const modules = useSelector((s: RootState) => s.modules.modules)
  const plan = useSelector((s: RootState) => normalizePlanId(s.business.business?.plan))
  const module = modules.find((item) => item.id === moduleId)

  if (!module) {
    return <>{children}</>
  }

  const hasAccess = (module.isEnabled ?? true) && planAllows(plan, module.requiredPlan)
  return hasAccess ? <>{children}</> : <Navigate to="/dashboard" replace />
}

export default function App() {
  const [showPreload, setShowPreload] = useState(true)
  const handlePreloadComplete = useCallback(() => setShowPreload(false), [])

  return (
    <ErrorBoundary>
      {showPreload && <PreloadScreen onComplete={handlePreloadComplete} />}
      <BrowserRouter>
        <AutoLoginHandler />
        <OnboardingGate />
        <GlobalSearch />
        <ToastContainer />
        <FeedbackWidget />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/oauth/callback" element={<OAuthCallbackPage />} />
          <Route path="/auth/complete-registration" element={<CompleteRegistrationPage />} />
          <Route path="/onboarding" element={<PrivateRoute><OnboardingWizardPage /></PrivateRoute>} />
          <Route path="/user/dashboard" element={<AuthRoute><UserDashboardPage /></AuthRoute>} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <DashboardLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="appointments" element={<ModuleRoute moduleId="appointments"><AppointmentsPage /></ModuleRoute>} />
            <Route path="calendar" element={<ModuleRoute moduleId="calendar"><CalendarPage /></ModuleRoute>} />
            <Route path="services" element={<ModuleRoute moduleId="services"><ServicesPage /></ModuleRoute>} />
            <Route path="packages" element={<ModuleRoute moduleId="packages"><PackagesPage /></ModuleRoute>} />
            <Route path="employees" element={<ModuleRoute moduleId="employees"><EmployeesPage /></ModuleRoute>} />
            <Route path="customers" element={<ModuleRoute moduleId="customers"><CustomersPage /></ModuleRoute>} />
            <Route path="payments" element={<ModuleRoute moduleId="payments"><PaymentsPage /></ModuleRoute>} />
            <Route path="campaigns" element={<ModuleRoute moduleId="campaigns"><CampaignsPage /></ModuleRoute>} />
            <Route path="gift-coupons" element={<ModuleRoute moduleId="gift-coupons"><GiftCouponsPage /></ModuleRoute>} />
            <Route path="discounts" element={<ModuleRoute moduleId="discounts"><DiscountsPage /></ModuleRoute>} />
            <Route path="chatbot" element={<ModuleRoute moduleId="chatbot"><ChatbotPage /></ModuleRoute>} />
            <Route path="whatsapp-bot" element={<ModuleRoute moduleId="whatsapp-bot"><WhatsAppBotPage /></ModuleRoute>} />
            <Route path="forms" element={<ModuleRoute moduleId="forms"><FormsPage /></ModuleRoute>} />
            <Route path="reports" element={<ModuleRoute moduleId="reports"><ReportsPage /></ModuleRoute>} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="plugins" element={<PluginsPage />} />
            <Route path="support" element={<SupportPage />} />
            <Route path="subscription" element={<SubscriptionPage />} />
            <Route path="settings/billing" element={<Navigate to="/subscription" replace />} />
            <Route path="settings/*" element={<SettingsPage />} />
            <Route path="maps" element={<ModuleRoute moduleId="maps"><MapsPage /></ModuleRoute>} />
            <Route path="walkin-queue" element={<ModuleRoute moduleId="walkin-queue"><WalkinQueuePage /></ModuleRoute>} />
            <Route path="waiting-list" element={<ModuleRoute moduleId="waiting-list"><WaitingListPage /></ModuleRoute>} />
            <Route path="loyalty" element={<ModuleRoute moduleId="loyalty"><LoyaltyPage /></ModuleRoute>} />
            <Route path="social-media" element={<ModuleRoute moduleId="social-media"><SocialMediaPage /></ModuleRoute>} />
            <Route path="surveys" element={<ModuleRoute moduleId="surveys"><SurveysPage /></ModuleRoute>} />
            <Route path="products" element={<ModuleRoute moduleId="products"><ProductsPage /></ModuleRoute>} />
            <Route path="receivables" element={<ModuleRoute moduleId="receivables"><ReceivablesPage /></ModuleRoute>} />
            <Route path="performance" element={<ModuleRoute moduleId="performance"><PerformancePage /></ModuleRoute>} />
            <Route path="commissions" element={<ModuleRoute moduleId="commissions"><CommissionsPage /></ModuleRoute>} />
            <Route path="debts" element={<ModuleRoute moduleId="debts"><DebtPage /></ModuleRoute>} />
            <Route path="branches" element={<ModuleRoute moduleId="branches"><BranchesPage /></ModuleRoute>} />
            <Route path="advertisements" element={<ModuleRoute moduleId="advertisements"><AdvertisementsPage /></ModuleRoute>} />
            <Route path="recommendations" element={<ModuleRoute moduleId="recommendations"><RecommendationsPage /></ModuleRoute>} />
            <Route path="no-show-prediction" element={<ModuleRoute moduleId="no-show-prediction"><NoShowPredictionPage /></ModuleRoute>} />
            <Route path="deposits" element={<ModuleRoute moduleId="deposits"><DepositsPage /></ModuleRoute>} />
            <Route path="smart-schedule" element={<ModuleRoute moduleId="smart-schedule"><SmartSchedulePage /></ModuleRoute>} />
            <Route path="error-monitor" element={<ErrorMonitorPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
