import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, Activity, Trophy, LogOut } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isPublicLiveViewer = location.pathname.startsWith('/live/');
  const isAdminScoring = location.pathname.includes('/score');
  
  const { session, signOut } = useAuthStore();

  // Hide bottom nav if we are in an active match to maximize space
  const showBottomNav = !isPublicLiveViewer && !isAdminScoring;

  const navItems = [
    { to: '/', icon: Trophy, label: 'Tournaments' },
    { to: '/admin', icon: Activity, label: 'Admin' },
  ];

  return (
    <div className="flex flex-col h-screen max-w-[430px] mx-auto bg-transparent overflow-hidden relative shadow-2xl">
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <Outlet />
      </main>

      {showBottomNav && (
        <nav className="glass-panel pb-safe pt-2 px-4 sticky bottom-0 z-50">
          <ul className="flex justify-between items-center mb-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.to} className="flex-1">
                  <NavLink to={item.to}>
                    {({ isActive }) => (
                      <div className={cn(
                        'flex flex-col items-center gap-1 p-2 transition-colors',
                        isActive
                          ? 'text-lime-DEFAULT'
                          : 'text-graphite-400 hover:text-graphite-200'
                      )}>
                        <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                        <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
                      </div>
                    )}
                  </NavLink>
                </li>
              );
            })}
            
            {session && (
              <li className="flex-1">
                <button 
                  onClick={async () => {
                    await signOut();
                    navigate('/');
                  }}
                  className="w-full flex flex-col items-center gap-1 p-2 text-graphite-400 hover:text-coral-DEFAULT transition-colors"
                >
                  <LogOut size={24} strokeWidth={2} />
                  <span className="text-[10px] font-medium tracking-wide">Sign Out</span>
                </button>
              </li>
            )}
          </ul>
        </nav>
      )}
    </div>
  );
}
