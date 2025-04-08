import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  currency: string;
  setCurrency: (currency: string) => void;
  currencySymbols: Record<string, string>;
}

const Navbar: React.FC<NavbarProps> = ({ currency, setCurrency, currencySymbols }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    // 🧹 Clear any stored user data (stub for now)
    localStorage.removeItem('token'); // if you're storing JWT token
    // 👇 Redirect to login
    navigate('/login');
  };

  return (
    <header className="flex items-center justify-between p-4 border-b border-gray-200 bg-white z-10 relative">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      <div className="flex items-center gap-4">
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="border border-gray-300 text-sm rounded-md px-3 py-1 bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
        >
          {Object.keys(currencySymbols).map((cur) => (
            <option key={cur} value={cur}>
              {cur}
            </option>
          ))}
        </select>

        {/* Profile dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center focus:outline-none"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
          >
            👤
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-md py-2 text-sm z-20">
              <button className="block w-full text-left px-4 py-2 hover:bg-gray-100">Settings</button>
              <button
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
