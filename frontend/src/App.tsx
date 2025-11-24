import { Link, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'

function DashboardPlaceholder() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white/90 p-10 text-center shadow-soft-xl backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-600">Success</p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900">You&apos;re signed in!</h1>
        <p className="mt-3 text-slate-500">
          Replace this placeholder with your real dashboard once it&apos;s ready.
        </p>
        <Link
          to="/login"
          className="mt-8 inline-flex rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-brand-600 hover:border-brand-300"
        >
          Back to login
        </Link>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<DashboardPlaceholder />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
