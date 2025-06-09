import React from 'react';

const DashboardPage = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
      <p className="text-gray-600">Welcome to your ImageWhiz dashboard! Overview and quick stats will go here.</p>
      {/* Placeholder content */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Total Links</h2>
          <p className="text-4xl font-bold text-blue-600">123</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Total Clicks</h2>
          <p className="text-4xl font-bold text-green-600">4,567</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Active Campaigns</h2>
          <p className="text-4xl font-bold text-purple-600">5</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
