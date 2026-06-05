import { Route, Routes } from 'react-router-dom'
import { NavBar } from './components/NavBar'
import { ToastHost } from './components/ToastHost'
import { AddFundsModal } from './components/AddFundsModal'
import { ConfettiHost } from './components/Confetti'
import { Onboarding } from './components/Onboarding'
import { HomePage } from './pages/HomePage'
import { MarketPage } from './pages/MarketPage'
import { PortfolioPage } from './pages/PortfolioPage'
import { ActivityPage } from './pages/ActivityPage'
import { AdminPage } from './pages/AdminPage'
import { LeaderboardPage } from './pages/LeaderboardPage'
import { useSimulation } from './store/useSimulation'

export default function App() {
  useSimulation()
  return (
    <div className="min-h-full flex flex-col">
      <NavBar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/market/:id" element={<MarketPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/activity" element={<ActivityPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>
      <footer className="border-t border-ink-600 py-6 text-center text-xs text-text-faint">
        Polymarket clone · fake money, real games · data from ESPN · not affiliated with Polymarket
      </footer>
      <ToastHost />
      <AddFundsModal />
      <ConfettiHost />
      <Onboarding />
    </div>
  )
}
