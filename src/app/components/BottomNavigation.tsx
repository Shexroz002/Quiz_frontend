import { useNavigate, useLocation } from 'react-router';
import { Home, ClipboardList, Users, BarChart3, User } from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  gradient: string;
  emoji: string;
}

export function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems: NavItem[] = [
    {
      id: 'home',
      label: 'Bosh',
      icon: <Home className="w-5 h-5" />,
      path: '/',
      gradient: 'from-indigo-500 to-purple-500',
      emoji: '🏠',
    },
    {
      id: 'tests',
      label: 'Testlar',
      icon: <ClipboardList className="w-5 h-5" />,
      path: '/create-test',
      gradient: 'from-emerald-500 to-teal-500',
      emoji: '📝',
    },
    {
      id: 'friends',
      label: "Do'stlar",
      icon: <Users className="w-5 h-5" />,
      path: '/friends',
      gradient: 'from-orange-500 to-red-500',
      emoji: '👥',
    },
    {
      id: 'stats',
      label: 'Statistika',
      icon: <BarChart3 className="w-5 h-5" />,
      path: '/statistic',
      gradient: 'from-pink-500 to-rose-500',
      emoji: '📊',
    },
    {
      id: 'profile',
      label: 'Profil',
      icon: <User className="w-5 h-5" />,
      path: '/profile',
      gradient: 'from-blue-500 to-cyan-500',
      emoji: '👤',
    },
  ];

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Backdrop Blur Container */}
      <div className="relative">
        {/* Gradient Bar at Top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 via-pink-500 via-orange-500 to-cyan-500"></div>

        {/* Main Navigation */}
        <div className="bg-white/95 backdrop-blur-xl border-t-2 border-white/50 shadow-2xl">
          <div className="px-2 py-3 max-w-lg mx-auto">
            <div className="flex items-center justify-around gap-1">
              {navItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.path)}
                    className="flex flex-col items-center gap-1.5 min-w-0 flex-1 relative group"
                  >
                    {/* Icon Container */}
                    <div className="relative">
                      {/* Active Background Glow */}
                      {active && (
                        <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} rounded-2xl blur-md opacity-40`}></div>
                      )}

                      {/* Icon Button */}
                      <div
                        className={`relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${active
                          ? `bg-gradient-to-br ${item.gradient} shadow-lg scale-110`
                          : 'bg-gray-100 hover:bg-gray-200 group-hover:scale-105'
                          }`}
                      >
                        {active ? (
                          <span className="text-2xl">{item.emoji}</span>
                        ) : (
                          <div className="text-gray-600 group-hover:text-gray-800">
                            {item.icon}
                          </div>
                        )}

                        {/* Sparkle Effect for Active */}
                        {active && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-md">
                            <span className="text-xs">✨</span>
                          </div>
                        )}
                      </div>

                      {/* Active Indicator Dot */}
                      {active && (
                        <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-gradient-to-r ${item.gradient} rounded-full`}></div>
                      )}
                    </div>

                    {/* Label */}
                    <span
                      className={`text-xs font-semibold transition-all duration-300 ${active
                        ? `bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent`
                        : 'text-gray-500 group-hover:text-gray-700'
                        }`}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* iPhone-style Safe Area */}
        <div className="bg-white/95 backdrop-blur-xl h-2"></div>
      </div>
    </div>
  );
}