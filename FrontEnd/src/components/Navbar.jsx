import React, { useState } from 'react';
import { 
  Settings, LogOut, User, ChevronDown, Bell,
  Search, Moon, Sun, Menu, X, Shield, BookOpen, GraduationCap
} from 'lucide-react';

const Navbar = ({ 
  user, 
  onLogout, 
  navigationItems = [], 
  activeView = '', 
  onNavigate,
  showSearch = false,
  onSearch,
  theme = 'light',
  onThemeToggle,
  notificationCount = 0
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const getInitials = (firstName, lastName) => {
    return `${(firstName || '').charAt(0)}${(lastName || '').charAt(0)}`.toUpperCase();
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(searchQuery);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4" />;
      case 'supervisor':
        return <BookOpen className="w-4 h-4" />;
      case 'student':
        return <GraduationCap className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  return (
    <nav className="bg-black shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Left side - Logo and Navigation */}
          <div className="flex items-center space-x-8">
            {/* Logo/Brand */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                ITU
              </div>
              <div className="hidden md:block">
                <h1 className="text-lg font-bold text-white leading-tight">
                  PhD Research Tracking
                </h1>
                <p className="text-xs text-gray-300 leading-tight">
                  Information Technology University
                </p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate && onNavigate(item.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeView === item.id
                      ? 'bg-gray-800 text-white shadow-md'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  {item.icon && <item.icon className="w-4 h-4 mr-2 inline" />}
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Center - Search */}
          {showSearch && (
            <div className="hidden md:flex flex-1 max-w-lg mx-8">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleSearch}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-lg leading-5 bg-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-white text-sm"
                  placeholder="Search students, forms, reports..."
                />
              </div>
            </div>
          )}

          {/* Right side - Actions and User Menu */}
          <div className="flex items-center space-x-4">
            
            {/* Notification Bell */}
            <button
              className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200 relative"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>

            {/* Theme Toggle */}
            {onThemeToggle && (
              <button
                onClick={onThemeToggle}
                className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200"
                title="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            )}

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 p-2 hover:bg-gray-800 transition-all duration-200"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md">
                  {getInitials(user?.first_name, user?.last_name)}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-medium text-white">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-gray-300 flex items-center">
                    {getRoleIcon(user?.role)}
                    <span className="ml-1 capitalize">{user?.role}</span>
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-300 hidden lg:block" />
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.first_name} {user?.last_name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {user?.email}
                      </p>
                      <div className="flex items-center mt-2">
                        {getRoleIcon(user?.role)}
                        <span className="text-xs text-gray-600 ml-1 capitalize">
                          {user?.role} Account
                        </span>
                      </div>
                    </div>
                    
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center transition-colors">
                      <User className="w-4 h-4 mr-3" />
                      Profile Settings
                    </button>
                    
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center transition-colors">
                      <Settings className="w-4 h-4 mr-3" />
                      Preferences
                    </button>
                    
                    <hr className="border-gray-200 my-1" />
                    
                    <button 
                      onClick={onLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200"
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-700 bg-gray-900">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate && onNavigate(item.id);
                    setShowMobileMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeView === item.id
                      ? 'bg-gray-800 text-white shadow-md'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  {item.icon && <item.icon className="w-4 h-4 mr-2 inline" />}
                  {item.label}
                </button>
              ))}
            </div>
            
            {/* Mobile Search */}
            {showSearch && (
              <div className="px-2 pb-3">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleSearch}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-lg leading-5 bg-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-white text-sm"
                    placeholder="Search students, forms, reports..."
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 