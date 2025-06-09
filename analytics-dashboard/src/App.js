import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import MyLinksPage from './pages/MyLinksPage';
import LinkAnalyticsPage from './pages/LinkAnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage'; // Import LoginPage
import SignupPage from './pages/SignupPage'; // Import SignupPage
import ProtectedRoute from './components/ProtectedRoute'; // Import ProtectedRoute
import './index.css'; 

// A simple component for a 404 Not Found page
const NotFoundPage = () => (
  <div className="text-center py-10">
    <h1 className="text-4xl font-bold text-red-500">404 - Not Found</h1>
    <p className="text-gray-600 mt-4">The page you are looking for does not exist.</p>
  </div>
);

// This component will wrap all routes that need the main application Layout
function AppRoutesWithLayout() {
  return (
    <Layout>
      <Routes>
        {/* 'index' route for this group, e.g., if path is '/' within this group, navigate to 'dashboard' */}
        <Route index element={<Navigate replace to="dashboard" />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="my-links" element={<MyLinksPage />} />
        <Route path="analytics/:linkId" element={<LinkAnalyticsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        {/* Catch-all for any routes not matched within this Layout group */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes that don't use the main Layout */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* 
          All other routes will be handled by AppRoutesWithLayout.
          The "/*" ensures that AppRoutesWithLayout handles its own nested routing.
          For example, a URL like "/dashboard" will be passed to AppRoutesWithLayout,
          which will then match its "dashboard" path.
        */}
        {/* Protected Routes: All routes within AppRoutesWithLayout are now protected */}
        <Route element={<ProtectedRoute />}>
          <Route path="/*" element={<AppRoutesWithLayout />} />
        </Route>
        
        {/* 
          Default redirect for the entire application.
          If a user navigates to the absolute root ("/"), they will be redirected to "/login".
          Note: The landing page (index.html) links for "Login" and "Sign Up" already point to "/dashboard".
          This redirect ensures that if the React app is accessed directly at its root, it goes to login.
          Once authentication is in place, this could redirect to "/dashboard" if logged in.
        */}
        {/* <Route path="/" element={<Navigate replace to="/login" />} /> */}

      </Routes>
    </Router>
  );
}

export default App;


