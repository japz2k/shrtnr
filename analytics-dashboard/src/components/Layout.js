import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      <Sidebar />
      <main className="flex-1 p-8 ml-64"> {/* ml-64 to offset for sidebar width */}
        {children}
      </main>
    </div>
  );
};

export default Layout;
