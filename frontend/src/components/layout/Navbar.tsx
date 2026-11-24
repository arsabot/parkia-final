import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Compass, 
  Bookmark, 
  CalendarCheck, 
  LayoutDashboard, 
  Car, 
  Grid, 
  LogOut, 
  User as UserIcon, 
  Menu, 
  X, 
  ShieldAlert,
  ParkingCircle,
  ScanLine,
  Building2,
  Crown,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../common/Button';
import { ThemeSwitch } from '../common/ThemeSwitch';
import { UserRole } from '../../types';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, isAdmin, isSuperAdmin, isOwner, logout, demoLogin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [demoDropdownOpen, setDemoDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const demoDropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (
        userDropdownOpen &&
        userDropdownRef.current &&
        !userDropdownRef.current.contains(target)
      ) {
        setUserDropdownOpen(false);
      }
      if (
        demoDropdownOpen &&
        demoDropdownRef.current &&
        !demoDropdownRef.current.contains(target)
      ) {
        setDemoDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setUserDropdownOpen(false);
        setDemoDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [userDropdownOpen, demoDropdownOpen]);

  useEffect(() => {
    setUserDropdownOpen(false);
    setDemoDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const isSearchPage = location.pathname === '/search';
  const isLoginPage = location.pathname === '/login';
  const isRegisterPage = location.pathname === '/register';
  const showLoginAction = !isLoginPage;
  const showRegisterAction = !isRegisterPage;

  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
    navigate('/login');
  };

  const handleQuickDemo = async (role: UserRole) => {
    setUserDropdownOpen(false);
    setDemoDropdownOpen(false);
    setMobileMenuOpen(false);

    // Si estamos en una ruta de administración y cambiamos a conductor, navegamos primero a /search
    // para evitar que los guards de rutas admin reaccionen en falso o causen parpadeos
    if (role === 'driver' && location.pathname.startsWith('/admin')) {
      navigate('/search', { replace: true });
    }

    await demoLogin(role);

    if (role === 'admin') {
      navigate('/admin', { replace: true });
    } else if (role === 'owner') {
      navigate('/admin/gate', { replace: true });
    } else {
      navigate('/search', { replace: true });
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-parkia-navy/95 backdrop-blur-md border-b border-slate-200/80 dark:border-parkia-line-dark transition-all">
      <div className={`${isSearchPage ? 'max-w-7xl xl:max-w-[1600px] px-4 sm:px-6 lg:px-8' : 'max-w-[1280px] px-4 sm:px-6'} mx-auto`}>
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          
          {/* Left: Brand Logo + Desktop Nav */}
          <div className="flex items-center gap-6 xl:gap-8 min-w-0">
            {/* Brand Logo */}
            <Link to="/" className="flex items-center gap-2 group shrink-0">
              <img
                src={isDark ? "/logo-parkia-oscuro.png" : "/logo-parkia.png"}
                alt="PARKIA"
                className="h-9 sm:h-[42px] w-auto object-contain drop-shadow-sm group-hover:scale-105 transition-transform"
              />
            </Link>

            {/* Navigation Links (Visible on Desktop lg+) */}
            <nav className="hidden lg:flex items-center gap-1.5 xl:gap-2.5">
              {!isAdmin ? (
                <>
                  <Link
                    to="/search"
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                      isActive('/search')
                        ? 'bg-lime-50 text-lime-700 border border-lime-200 dark:bg-parkia-lime/10 dark:text-parkia-lime dark:border-parkia-lime/40 dark:shadow-[0_0_16px_rgba(163,230,53,0.12)]'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Compass className="w-4 h-4 shrink-0" />
                    <span>Buscar</span>
                  </Link>

                  <Link
                    to="/my-reservations"
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                      isActive('/my-reservations')
                        ? 'bg-brand-50 text-brand-700 dark:bg-parkia-blue/30 dark:text-blue-300'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <CalendarCheck className="w-4 h-4 shrink-0" />
                    <span>Mis Reservas</span>
                  </Link>

                  <Link
                    to="/favorites"
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                      isActive('/favorites')
                        ? 'bg-brand-50 text-brand-700 dark:bg-parkia-blue/30 dark:text-blue-300'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Bookmark className="w-4 h-4 shrink-0" />
                    <span>Favoritos</span>
                  </Link>
                </>
              ) : isSuperAdmin ? (
                /* Super Admin Links */
                <>
                  <Link
                    to="/admin"
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                      isActive('/admin')
                        ? 'bg-brand-50 text-brand-700 dark:bg-parkia-blue/30 dark:text-blue-300'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4 shrink-0" />
                    <span>Dashboard</span>
                  </Link>

                  <Link
                    to="/admin/parkings"
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${
                      isActive('/admin/parkings')
                        ? 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-700/60'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Garajes</span>
                  </Link>

                  <Link
                    to="/admin/gate"
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                      isActive('/admin/gate')
                        ? 'bg-teal-50 text-teal-800 font-bold border border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-700/60'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <ScanLine className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span>Control QR</span>
                  </Link>

                  <Link
                    to="/admin/spaces"
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                      isActive('/admin/spaces')
                        ? 'bg-brand-50 text-brand-700 dark:bg-parkia-blue/30 dark:text-blue-300'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Grid className="w-4 h-4 shrink-0" />
                    <span>Plazas</span>
                  </Link>

                  <Link
                    to="/admin/reservations"
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                      isActive('/admin/reservations')
                        ? 'bg-brand-50 text-brand-700 dark:bg-parkia-blue/30 dark:text-blue-300'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <CalendarCheck className="w-4 h-4 shrink-0" />
                    <span>Reservas</span>
                  </Link>
                </>
              ) : (
                /* Parking Owner / Operator Links */
                <>
                  <Link
                    to="/admin/gate"
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${
                      isActive('/admin/gate')
                        ? 'bg-teal-50 text-teal-800 border border-teal-200 shadow-sm dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-700/60'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <ScanLine className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span>Cámara QR & Garita</span>
                  </Link>

                  <Link
                    to="/admin/spaces"
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${
                      isActive('/admin/spaces')
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700/60'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Grid className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Plazas Vacantes</span>
                  </Link>

                  <Link
                    to="/admin/reservations"
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                      isActive('/admin/reservations')
                        ? 'bg-brand-50 text-brand-700 dark:bg-parkia-blue/30 dark:text-blue-300'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <CalendarCheck className="w-4 h-4 shrink-0" />
                    <span>Caja & Turnos</span>
                  </Link>
                </>
              )}
            </nav>
          </div>

          {/* Right: Actions (Desktop lg+) */}
          <div className="hidden lg:flex items-center gap-3 xl:gap-4 shrink-0">
            {!isAuthenticated ? (
              <>
                {/* Demo Dropdown Selector */}
                <div className="relative shrink-0" ref={demoDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setDemoDropdownOpen(!demoDropdownOpen)}
                    aria-expanded={demoDropdownOpen}
                    aria-haspopup="true"
                    aria-label="Acceso demo rápido"
                    className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-1.5 rounded-xl border border-blue-200/90 dark:border-blue-800/60 bg-blue-50/80 dark:bg-blue-950/40 text-xs font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-all shadow-sm cursor-pointer"
                    title="Ingresar rápido con un perfil de prueba"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Demo</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${demoDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {demoDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-parkia-card-dark rounded-2xl shadow-2xl border border-slate-200 dark:border-parkia-line-dark p-2 animate-scale-in z-50 overflow-hidden">
                      <div className="px-3 py-1.5 border-b border-slate-100 dark:border-parkia-line-dark mb-1">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          Acceso Demo Rápido
                        </p>
                      </div>
                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() => handleQuickDemo('driver')}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
                            <Car className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="leading-tight font-bold">Conductor</p>
                            <p className="text-[10px] font-normal text-slate-500 dark:text-slate-400">Reservar estacionamiento</p>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickDemo('owner')}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-teal-800 dark:text-teal-200 hover:bg-teal-50 dark:hover:bg-teal-950/60 text-left transition-colors cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-950/70 text-teal-800 dark:text-teal-200 flex items-center justify-center shrink-0">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="leading-tight font-bold">Dueño Garaje</p>
                            <p className="text-[10px] font-normal text-teal-600 dark:text-teal-400">Control QR y plazas</p>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickDemo('admin')}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-amber-800 dark:text-amber-200 hover:bg-amber-50 dark:hover:bg-amber-950/60 text-left transition-colors cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-200 flex items-center justify-center shrink-0">
                            <Crown className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="leading-tight font-bold">Super Admin</p>
                            <p className="text-[10px] font-normal text-amber-600 dark:text-amber-400">Gestión de garajes</p>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="h-6 w-px bg-slate-200 dark:bg-parkia-line-dark" aria-hidden="true" />

                {/* Theme Switch */}
                <ThemeSwitch isDark={isDark} onToggle={toggleTheme} className="shrink-0" />

                <div className="h-6 w-px bg-slate-200 dark:bg-parkia-line-dark" aria-hidden="true" />

                {/* Auth Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {showLoginAction && (
                    <Link to="/login" className="shrink-0">
                      <Button variant={isRegisterPage ? 'primary' : 'ghost'} size="sm">
                        Iniciar Sesión
                      </Button>
                    </Link>
                  )}
                  {showRegisterAction && (
                    <Link to="/register" className="shrink-0">
                      <Button variant="primary" size="sm">
                        Registrarse
                      </Button>
                    </Link>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Theme Switch */}
                <ThemeSwitch isDark={isDark} onToggle={toggleTheme} className="shrink-0" />

                <div className="h-6 w-px bg-slate-200 dark:bg-parkia-line-dark" aria-hidden="true" />

                {/* User Dropdown Anchor */}
                <div className="relative shrink-0" ref={userDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    aria-expanded={userDropdownOpen}
                    aria-haspopup="true"
                    aria-label="Menú de usuario"
                    className="flex items-center gap-3 p-1.5 pl-3 rounded-2xl border border-slate-200 dark:border-parkia-line-dark hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer shadow-sm"
                  >
                    <div className="text-left hidden xl:block max-w-[140px]">
                      <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate">
                        {user?.first_name} {user?.last_name}
                      </p>
                      <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                        isSuperAdmin 
                          ? 'text-amber-600 dark:text-amber-400' 
                          : isOwner 
                          ? 'text-teal-600 dark:text-teal-400' 
                          : 'text-brand-600 dark:text-brand-400'
                      }`}>
                        {isSuperAdmin 
                          ? 'Super Admin' 
                          : isOwner 
                          ? 'Dueño Garaje' 
                          : 'Conductor'}
                      </span>
                    </div>
                    <div className={`w-9 h-9 rounded-xl font-black flex items-center justify-center text-sm shadow-inner shrink-0 ${
                      isSuperAdmin
                        ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-200'
                        : isOwner
                        ? 'bg-teal-100 dark:bg-teal-950/70 text-teal-800 dark:text-teal-200'
                        : 'bg-brand-100 dark:bg-brand-950/70 text-brand-700 dark:text-brand-200'
                    }`}>
                      {user?.first_name ? user.first_name[0] : (user?.email ? user.email[0].toUpperCase() : 'U')}
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {userDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-parkia-card-dark rounded-2xl shadow-2xl border border-slate-200 dark:border-parkia-line-dark py-2 animate-scale-in z-50 overflow-hidden">
                      <div className="px-4 py-2 border-b border-slate-100 dark:border-parkia-line-dark">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Sesión iniciada como</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.email}</p>
                        <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-md font-extrabold ${
                          isSuperAdmin 
                            ? 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800' 
                            : isOwner 
                            ? 'bg-teal-50 text-teal-800 border border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800' 
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {isSuperAdmin ? 'Super Administrador (Ariel)' : isOwner ? 'Dueño Garaje Operador' : 'Conductor'}
                        </span>
                      </div>

                      <div className="py-1">
                        {isSuperAdmin ? (
                          <>
                            <Link
                              to="/admin"
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                              <LayoutDashboard className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                              Panel General
                            </Link>
                            <Link
                              to="/admin/parkings"
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-amber-700 dark:text-amber-300 font-semibold hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Crown className="w-4 h-4 text-amber-500" />
                              Alta y Baja de Garajes
                            </Link>
                            <Link
                              to="/admin/gate"
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                              <ScanLine className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                              Cámara QR & Garita
                            </Link>
                          </>
                        ) : isOwner ? (
                          <>
                            <Link
                              to="/admin/gate"
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-teal-800 dark:text-teal-300 font-bold hover:bg-teal-50 dark:hover:bg-slate-800 transition-colors"
                            >
                              <ScanLine className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                              Cámara QR & Control Garita
                            </Link>
                            <Link
                              to="/admin/spaces"
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Grid className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              Plazas Vacantes en Vivo
                            </Link>
                            <Link
                              to="/admin/reservations"
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                              <CalendarCheck className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                              Caja & Historial
                            </Link>
                          </>
                        ) : (
                          <>
                            <Link
                              to="/my-reservations"
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                              <CalendarCheck className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                              Mis Reservas
                            </Link>
                            <Link
                              to="/favorites"
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Bookmark className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                              Mis Favoritos
                            </Link>
                          </>
                        )}
                      </div>

                      <div className="border-t border-slate-100 dark:border-parkia-line-dark pt-1">
                        <div className="px-3 py-1">
                          <p className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 px-1 mb-1">
                            Cambiar de rol demo:
                          </p>
                          <div className="grid grid-cols-3 gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleQuickDemo('driver')}
                              className="px-1.5 py-1.5 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-center transition-colors truncate"
                            >
                              Conductor
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickDemo('owner')}
                              className="px-1.5 py-1.5 text-[11px] font-bold rounded-lg bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900/80 text-teal-800 dark:text-teal-200 text-center transition-colors truncate border border-teal-200 dark:border-teal-800/60"
                            >
                              Dueño
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickDemo('admin')}
                              className="px-1.5 py-1.5 text-[11px] font-bold rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/80 text-amber-800 dark:text-amber-200 text-center transition-colors truncate border border-amber-200 dark:border-amber-800/60"
                            >
                              Super
                            </button>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full text-left flex items-center gap-2 px-4 py-2 mt-1 text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Cerrar Sesión
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Mobile / Tablet Controls (< lg) */}
          <div className="flex lg:hidden items-center gap-2.5 shrink-0">
            <ThemeSwitch isDark={isDark} onToggle={toggleTheme} className="shrink-0" />

            {/* If logged in on mobile/tablet, show user avatar quick button */}
            {isAuthenticated && (
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  aria-expanded={userDropdownOpen}
                  aria-label="Perfil de usuario"
                  className={`w-9 h-9 rounded-xl font-black flex items-center justify-center text-sm shadow-inner shrink-0 border border-slate-200 dark:border-parkia-line-dark cursor-pointer ${
                    isSuperAdmin
                      ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-200'
                      : isOwner
                      ? 'bg-teal-100 dark:bg-teal-950/70 text-teal-800 dark:text-teal-200'
                      : 'bg-brand-100 dark:bg-brand-950/70 text-brand-700 dark:text-brand-200'
                  }`}
                >
                  {user?.first_name ? user.first_name[0] : (user?.email ? user.email[0].toUpperCase() : 'U')}
                </button>
              </div>
            )}

            {/* Hamburger Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
              className="min-h-[42px] min-w-[42px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-parkia-line-dark bg-white dark:bg-parkia-card-dark text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-sm"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile & Tablet Drawer (Visible only on < lg) */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-parkia-line-dark bg-white dark:bg-parkia-navy px-4 pt-4 pb-6 space-y-4 animate-fade-in shadow-xl">
          <nav className="flex flex-col gap-1.5">
            {!isAdmin ? (
              <>
                <Link
                  to="/search"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-base font-semibold transition-colors ${
                    isActive('/search')
                      ? 'bg-lime-50 text-lime-800 dark:bg-parkia-lime/10 dark:text-parkia-lime'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                  }`}
                >
                  <Compass className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  <span>Buscar Estacionamientos</span>
                </Link>
                <Link
                  to="/my-reservations"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-base font-semibold transition-colors ${
                    isActive('/my-reservations')
                      ? 'bg-brand-50 text-brand-800 dark:bg-parkia-blue/30 dark:text-blue-300'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                  }`}
                >
                  <CalendarCheck className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  <span>Mis Reservas</span>
                </Link>
                <Link
                  to="/favorites"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-base font-semibold transition-colors ${
                    isActive('/favorites')
                      ? 'bg-brand-50 text-brand-800 dark:bg-parkia-blue/30 dark:text-blue-300'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                  }`}
                >
                  <Bookmark className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  <span>Favoritos</span>
                </Link>
              </>
            ) : isSuperAdmin ? (
              <>
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-2xl text-base font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70"
                >
                  <LayoutDashboard className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  <span>Dashboard Global</span>
                </Link>
                <Link
                  to="/admin/parkings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-2xl text-base font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                >
                  <Crown className="w-5 h-5 text-amber-500" />
                  <span>Alta y Baja de Garajes</span>
                </Link>
                <Link
                  to="/admin/gate"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-2xl text-base font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70"
                >
                  <ScanLine className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  <span>Control Accesos & QR</span>
                </Link>
                <Link
                  to="/admin/spaces"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-2xl text-base font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70"
                >
                  <Grid className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  <span>Plazas</span>
                </Link>
                <Link
                  to="/admin/reservations"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-2xl text-base font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70"
                >
                  <CalendarCheck className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  <span>Reservas</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/admin/gate"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-2xl text-base font-bold text-teal-800 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40"
                >
                  <ScanLine className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  <span>Cámara QR & Garita</span>
                </Link>
                <Link
                  to="/admin/spaces"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-2xl text-base font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                >
                  <Grid className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Plazas Vacantes en Vivo</span>
                </Link>
                <Link
                  to="/admin/reservations"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-2xl text-base font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70"
                >
                  <CalendarCheck className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  <span>Caja & Turnos</span>
                </Link>
              </>
            )}
          </nav>

          <div className="pt-4 border-t border-slate-200 dark:border-parkia-line-dark flex flex-col gap-3">
            {!isAuthenticated ? (
              <>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-center">
                  Acceso Demo Rápido:
                </p>
                <div className="grid grid-cols-3 gap-2 pb-1">
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('driver')}
                    className="p-2.5 text-xs font-bold rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-parkia-line-dark text-slate-800 dark:text-slate-200 text-center flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  >
                    <Car className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                    <span>Conductor</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('owner')}
                    className="p-2.5 text-xs font-bold rounded-2xl bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-200 text-center border border-teal-200 dark:border-teal-800/60 flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  >
                    <Building2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    <span>Dueño</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('admin')}
                    className="p-2.5 text-xs font-bold rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 text-center border border-amber-200 dark:border-amber-800/60 flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  >
                    <Crown className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                    <span>Super</span>
                  </button>
                </div>
                {showLoginAction && (
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant={isRegisterPage ? 'primary' : 'outline'} className="w-full">
                      Iniciar Sesión
                    </Button>
                  </Link>
                )}
                {showRegisterAction && (
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="primary" className="w-full">
                      Registrarse
                    </Button>
                  </Link>
                )}
              </>
            ) : (
              <div className="space-y-3">
                <div className="p-4 bg-slate-50 dark:bg-parkia-card-dark rounded-2xl border border-slate-200 dark:border-parkia-line-dark">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{user?.first_name} {user?.last_name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
                  <p className={`text-[11px] font-extrabold uppercase mt-1.5 ${
                    isSuperAdmin ? 'text-amber-600 dark:text-amber-400' : isOwner ? 'text-teal-600 dark:text-teal-400' : 'text-brand-600 dark:text-brand-400'
                  }`}>
                    {isSuperAdmin ? 'Super Administrador (Ariel)' : isOwner ? 'Dueño Garaje Operador' : 'Conductor'}
                  </p>
                </div>
                <Button variant="danger" onClick={handleLogout} className="w-full">
                  Cerrar Sesión
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
