import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { GameProvider } from './store/GameContext.js';
import { CharacterLibraryProvider } from './store/CharacterLibraryContext.js';
import { AppShell } from './components/layout/AppShell.js';

// Resilient lazy loader that retries on transient network/Vite reload errors
function lazyWithRetry<T extends { default: React.ComponentType<any> }>(
  factory: () => Promise<T>,
  retries = 2,
  interval = 400
): React.LazyExoticComponent<React.ComponentType<any>> {
  return lazy(() =>
    new Promise<T>((resolve, reject) => {
      const attempt = (remaining: number) => {
        factory()
          .then(resolve)
          .catch((error: any) => {
            if (remaining <= 0) {
              reject(error);
              return;
            }
            console.warn(`[App] Module load failed, retrying in ${interval}ms (${remaining} attempts left)...`);
            setTimeout(() => attempt(remaining - 1), interval);
          });
      };
      attempt(retries);
    })
  );
}

// Code splitting via lazyWithRetry
const LandingPage = lazyWithRetry(() => import('./pages/LandingPage.js').then(m => ({ default: m.LandingPage })));
const DashboardPage = lazyWithRetry(() => import('./pages/DashboardPage.js').then(m => ({ default: m.DashboardPage })));
const QuestsPage = lazyWithRetry(() => import('./pages/QuestsPage.js').then(m => ({ default: m.QuestsPage })));
const CampusMapPage = lazyWithRetry(() => import('./pages/CampusMapPage.js').then(m => ({ default: m.CampusMapPage })));
const EventsPage = lazyWithRetry(() => import('./pages/EventsPage.js').then(m => ({ default: m.EventsPage })));
const WardrobePage = lazyWithRetry(() => import('./pages/WardrobePage.js').then(m => ({ default: m.WardrobePage })));
const AchievementsPage = lazyWithRetry(() => import('./pages/AchievementsPage.js').then(m => ({ default: m.AchievementsPage })));
const ProfilePage = lazyWithRetry(() => import('./pages/ProfilePage.js').then(m => ({ default: m.ProfilePage })));
const PackagesPage = lazyWithRetry(() => import('./pages/PackagesPage.js').then(m => ({ default: m.PackagesPage })));
const PackageDetailPage = lazyWithRetry(() => import('./pages/PackageDetailPage.js').then(m => ({ default: m.PackageDetailPage })));
const CartPage = lazyWithRetry(() => import('./pages/CartPage.js').then(m => ({ default: m.CartPage })));
const CheckoutPage = lazyWithRetry(() => import('./pages/CheckoutPage.js').then(m => ({ default: m.CheckoutPage })));
const OrderDetailPage = lazyWithRetry(() => import('./pages/OrderDetailPage.js').then(m => ({ default: m.OrderDetailPage })));
const AboutPage = lazyWithRetry(() => import('./pages/AboutPage.js').then(m => ({ default: m.AboutPage })));
const ContactPage = lazyWithRetry(() => import('./pages/ContactPage.js').then(m => ({ default: m.ContactPage })));
const NotFoundPage = lazyWithRetry(() => import('./pages/NotFoundPage.js').then(m => ({ default: m.NotFoundPage })));

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[App] Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 px-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center text-xl font-bold font-pixel">
            !
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold font-heading text-slate-100">Không thể tải trang</h2>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Dữ liệu vừa được cập nhật hoặc kết nối tạm thời bị gián đoạn. Vui lòng bấm tải lại trang để tiếp tục.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold font-pixel transition-colors shadow-lg cursor-pointer"
          >
            Tải lại trang (Reload)
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const LoadingSpinner: React.FC = () => (
  <div className="py-24 flex flex-col items-center justify-center space-y-3">
    <div className="w-10 h-10 border-4 border-violet-500/30 border-t-violet-400 rounded-full animate-spin" />
    <span className="text-xs font-pixel text-violet-300">Đang tải Dungeon...</span>
  </div>
);

export default function App() {
  return (
    <HashRouter>
      <GameProvider>
        <CharacterLibraryProvider>
          <AppShell>
            <ErrorBoundary>
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  {/* Public Area */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/packages" element={<PackagesPage />} />
                  <Route path="/packages/:id" element={<PackageDetailPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/order/:id" element={<OrderDetailPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/contact" element={<ContactPage />} />

                  {/* Game Area */}
                  <Route path="/play" element={<DashboardPage />} />
                  <Route path="/play/quests" element={<QuestsPage />} />
                  <Route path="/play/map" element={<CampusMapPage />} />
                  <Route path="/play/timetable" element={<CampusMapPage defaultView="timetable" />} />
                  <Route path="/play/events" element={<EventsPage />} />
                  <Route path="/play/wardrobe" element={<WardrobePage />} />
                  <Route path="/play/achievements" element={<AchievementsPage />} />
                  <Route path="/play/profile" element={<ProfilePage />} />

                  {/* 404 Catch-All */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </AppShell>
        </CharacterLibraryProvider>
      </GameProvider>
    </HashRouter>
  );
}
