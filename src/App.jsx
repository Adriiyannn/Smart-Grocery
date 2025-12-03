import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import ConfirmEmail from './pages/ConfirmEmail'
import GroceryList from './pages/GroceryList'
import MealPlanner from './pages/MealPlanner'
import Inventory from './pages/Inventory'
import Profile from './pages/Profile'
import Navbar from './components/Navbar'
import supabase from './utils/supabase'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState('light')
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    // Check if user is logged in on app load
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
      setLoading(false)
    }

    getSession()

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null)
      }
    )

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      {user && <Navbar user={user} onLogout={() => supabase.auth.signOut()} alerts={alerts} onAlertsUpdate={setAlerts} />}
      <main className="pb-16 md:pb-0">
        <Routes>
          <Route path="/auth/confirm-email" element={<ConfirmEmail />} />
          <Route path="/profile" element={user ? <Profile user={user} onThemeChange={setTheme} onAlertsUpdate={setAlerts} /> : <Landing />} />
          <Route path="/grocery-list" element={user ? <GroceryList /> : <Landing />} />
          <Route path="/meal-planner" element={user ? <MealPlanner /> : <Landing />} />
          <Route path="/inventory" element={user ? <Inventory /> : <Landing />} />
          <Route path="/" element={user ? <Dashboard onAlertsUpdate={setAlerts} /> : <Landing />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </Router>
  )
}

export default App