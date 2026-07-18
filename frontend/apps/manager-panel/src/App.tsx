import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'
import { LoginPage } from '@/pages/auth/LoginPage'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { BusinessesPage } from '@/pages/businesses/BusinessesPage'
import { PaymentsPage } from '@/pages/payments/PaymentsPage'
import { FeedbackPage } from '@/pages/feedback/FeedbackPage'
import { UsersPage } from '@/pages/users/UsersPage'
import { CustomersPage } from '@/pages/customers/CustomersPage'
import { ToastContainer } from '@/components/ui/Toast'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { accessToken, role } = useSelector((s: RootState) => s.auth)
  return accessToken && role === 'platform_admin' ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
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
          <Route path="businesses" element={<BusinessesPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="feedback" element={<FeedbackPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="customers" element={<CustomersPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
