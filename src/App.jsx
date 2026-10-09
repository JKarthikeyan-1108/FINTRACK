import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import LandingPage from './pages/LandingPage';
import AppShell from './components/layout/AppShell';
import HomePage from './pages/HomePage';
import TransactionsPage from './pages/TransactionsPage';
import BudgetsPage from './pages/BudgetsPage';
import GoalsPage from './pages/GoalsPage';
import InvestmentsPage from './pages/InvestmentsPage';
import LoansPage from './pages/LoansPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import SettingsPage from './pages/SettingsPage';
import CategoriesPage from './pages/CategoriesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import JWTInspector from './pages/JWTInspector';

function Protected({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100dvh', background: '#eef7ef' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <div style={{ fontSize: 13, color: '#66706a', fontWeight: 800 }}>Loading FinTrack...</div>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function PublicOnly({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <Navigate to="/home" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicOnly><LandingPage /></PublicOnly>} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/app" element={<Protected><AppShell /></Protected>}>
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="home" element={<HomePage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="budgets" element={<BudgetsPage />} />
        <Route path="goals" element={<GoalsPage />} />
        <Route path="investments" element={<InvestmentsPage />} />
        <Route path="loans" element={<LoansPage />} />
        <Route path="subscriptions" element={<SubscriptionsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="jwt" element={<JWTInspector />} />
      </Route>
      {/* Keep old routes working */}
      <Route path="/home" element={<Protected><AppShell /></Protected>}>
        <Route index element={<HomePage />} />
      </Route>
      <Route path="/transactions" element={<Protected><AppShell /></Protected>}>
        <Route index element={<TransactionsPage />} />
      </Route>
      <Route path="/budgets" element={<Protected><AppShell /></Protected>}>
        <Route index element={<BudgetsPage />} />
      </Route>
      <Route path="/goals" element={<Protected><AppShell /></Protected>}>
        <Route index element={<GoalsPage />} />
      </Route>
      <Route path="/investments" element={<Protected><AppShell /></Protected>}>
        <Route index element={<InvestmentsPage />} />
      </Route>
      <Route path="/loans" element={<Protected><AppShell /></Protected>}>
        <Route index element={<LoansPage />} />
      </Route>
      <Route path="/subscriptions" element={<Protected><AppShell /></Protected>}>
        <Route index element={<SubscriptionsPage />} />
      </Route>
      <Route path="/analytics" element={<Protected><AppShell /></Protected>}>
        <Route index element={<AnalyticsPage />} />
      </Route>
      <Route path="/categories" element={<Protected><AppShell /></Protected>}>
        <Route index element={<CategoriesPage />} />
      </Route>
      <Route path="/settings" element={<Protected><AppShell /></Protected>}>
        <Route index element={<SettingsPage />} />
      </Route>
      <Route path="/jwt" element={<Protected><AppShell /></Protected>}>
        <Route index element={<JWTInspector />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
