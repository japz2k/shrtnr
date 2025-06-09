import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom'; // We'll use NavLink for active styling

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    sessionStorage.removeItem('accessToken'); // Also remove from sessionStorage
    window.location.href = '/';
  };

  const navLinkClasses = ({ isActive }) =>
    `block py-2.5 px-4 rounded transition duration-200 hover:bg-blue-500 hover:text-white ${
      isActive ? 'bg-blue-500 text-white' : 'text-gray-700'
    }`;

  return (
    <div className="w-64 h-screen bg-white shadow-md fixed top-0 left-0 pt-5">
      <div className="px-6 mb-10">
        <Link to="/" className="text-2xl font-bold text-blue-600">
          🔗 ImageWhiz
        </Link>
      </div>
      <nav>
        <ul>
          <li>
            <NavLink to="/dashboard" className={navLinkClasses}>
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink to="/my-links" className={navLinkClasses}>
              My Links
            </NavLink>
          </li>
          <li>
            {/* We'll make this dynamic later, e.g., /analytics/xyz789 */}
            <NavLink to="/analytics/xyz789" className={navLinkClasses}>
              Analytics
            </NavLink>
          </li>
          <li>
            <NavLink to="/settings" className={navLinkClasses}>
              Settings
            </NavLink>
          </li>
          {/* Add Logout functionality later */}
          <li className="absolute bottom-5 w-full px-4">
            <button
              className="w-full py-2.5 px-4 rounded transition duration-200 bg-red-500 text-white hover:bg-red-600"
              onClick={handleLogout}
            >
              Logout
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
