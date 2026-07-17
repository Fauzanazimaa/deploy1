import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'

import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminDataSchema from './pages/admin/AdminDataSchema'
import AdminTasks from './pages/admin/AdminTasks'
import AdminSubmissions from './pages/admin/AdminSubmissions'
import AdminManualEntries from './pages/admin/AdminManualEntries'
import AdminPenduduk from './pages/admin/AdminPenduduk'

import ContributorLayout from './pages/contributor/ContributorLayout'
import ContributorDashboard from './pages/contributor/ContributorDashboard'
import ContributorTasks from './pages/contributor/ContributorTasks'
import ContributorSubmissions from './pages/contributor/ContributorSubmissions'

import ViewerLayout from './pages/viewer/ViewerLayout'
import ViewerDashboard from './pages/viewer/ViewerDashboard'
import ViewerData from './pages/viewer/ViewerData'
import ViewerPenduduk from './pages/viewer/ViewerPenduduk'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="data-schema" element={<AdminDataSchema />} />
            <Route path="tasks" element={<AdminTasks />} />
            <Route path="submissions" element={<AdminSubmissions />} />
            <Route path="manual-entries" element={<AdminManualEntries />} />
            <Route path="penduduk" element={<AdminPenduduk />} />
          </Route>

          {/* Contributor Routes */}
          <Route
            path="/contributor"
            element={
              <ProtectedRoute roles={['contributor']}>
                <ContributorLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ContributorDashboard />} />
            <Route path="tasks" element={<ContributorTasks />} />
            <Route path="submissions" element={<ContributorSubmissions />} />
          </Route>

          {/* Viewer Routes */}
          <Route
            path="/viewer"
            element={
              <ProtectedRoute roles={['viewer']}>
                <ViewerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ViewerDashboard />} />
            <Route path="data" element={<ViewerData />} />
            <Route path="penduduk" element={<ViewerPenduduk />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
