import React, { useState } from 'react';
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
  Sparkles,
  ScanLine,
  Building2,
  Crown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';
import { UserRole } from '../../types';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, isAdmin, isSuperAdmin, isOwner, logout, demoLogin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
    navigate('/login');
  };

  const handleQuickDemo = async (role: UserRole) => {
    await demoLogin(role);
    setUserDropdownOpen(false);
    if (role === 'admin') {
      navigate('/admin');
    } else if (role === 'owner') {
      navigate('/admin/gate');
    } else {
      navigate('/search');
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="/logo-icon.png"
              alt="PARKIA"
              className="w-10 h-10 object-contain drop-shadow-md group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight text-navy-900 leading-none">
                PARKIA
              </span>
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500 mt-0.5">
                ESTACIONA FÁCIL
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {!isAdmin ? (
              <>
                <Link
                  to="/search"
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    isActive('/search')
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Compass className="w-4 h-4" />
                  Buscar
                </Link>

                <Link
                  to="/my-reservations"
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    isActive('/my-reservations')
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <CalendarCheck className="w-4 h-4" />
                  Mis Reservas
                </Link>

                <Link
                  to="/favorites"
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    isActive('/favorites')
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Bookmark className="w-4 h-4" />
                  Favoritos
                </Link>
              </>
            ) : isSuperAdmin ? (
              /* Super Admin Links (Platform Master) */
              <>
                <Link
                  to="/admin"
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    isActive('/admin')
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>

                <Link
                  to="/admin/parkings"
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-colors ${
                    isActive('/admin/parkings')
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Crown className="w-4 h-4 text-amber-500" />
                  Alta/Baja Garajes
                </Link>

                <Link
                  to="/admin/gate"
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    isActive('/admin/gate')
                      ? 'bg-teal-50 text-teal-800 font-bold border border-teal-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <ScanLine className="w-4 h-4 text-teal-600" />
                  Control Accesos & QR
                </Link>

                <Link
                  to="/admin/spaces"
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    isActive('/admin/spaces')
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                  Plazas
                </Link>

                <Link
                  to="/admin/reservations"
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    isActive('/admin/reservations')
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <CalendarCheck className="w-4 h-4" />
                  Reservas
                </Link>
              </>
            ) : (
              /* Parking Owner / Operator Links (Garaje Tools) */
              <>
                <Link
                  to="/admin/gate"
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                    isActive('/admin/gate')
                      ? 'bg-teal-50 text-teal-800 border border-teal-200 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <ScanLine className="w-4 h-4 text-teal-600" />
                  Cámara QR & Garita
                </Link>

                <Link
                  to="/admin/spaces"
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                    isActive('/admin/spaces')
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Grid className="w-4 h-4 text-emerald-600" />
                  Plazas Vacantes en Vivo
                </Link>

                <Link
                  to="/admin/reservations"
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    isActive('/admin/reservations')
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <CalendarCheck className="w-4 h-4" />
                  Caja & Turnos
                </Link>
              </>
            )}
          </nav>

          {/* User / Auth Actions */}
          <div className="hidden md:flex items-center gap-3">
            {!isAuthenticated ? (
              <div className="flex items-center gap-2">
                {/* Demo Logins for fast testing */}
                <div className="hidden xl:flex items-center gap-1.5 mr-2">
                  <button
                    onClick={() => handleQuickDemo('driver')}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors flex items-center gap-1"
                    title="Entrar rápido como conductor demo"
                  >
                    <Sparkles className="w-3 h-3 text-brand-600" />
                    Conductor
                  </button>
                  <button
                    onClick={() => handleQuickDemo('owner')}
                    className="text-xs px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold transition-colors flex items-center gap-1 border border-teal-200"
                    title="Entrar rápido como Dueño de Estacionamiento (Roberto Garaje Central)"
                  >
                    <Building2 className="w-3 h-3 text-teal-600" />
                    Dueño Garaje
                  </button>
                  <button
                    onClick={() => handleQuickDemo('admin')}
                    className="text-xs px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold transition-colors flex items-center gap-1 border border-amber-200"
                    title="Entrar rápido como Super Admin Ariel (Alta/Baja de Garajes)"
                  >
                    <Crown className="w-3 h-3 text-amber-600" />
                    Super Admin
                  </button>
                </div>

                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Iniciar Sesión
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Registrarse
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-3 p-1.5 pl-3 rounded-2xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all focus:outline-none"
                >
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-900 leading-tight">
                      {user?.first_name} {user?.last_name}
                    </p>
                    <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                      isSuperAdmin 
                        ? 'text-amber-600' 
                        : isOwner 
                        ? 'text-teal-600' 
                        : 'text-brand-600'
                    }`}>
                      {isSuperAdmin 
                        ? '👑 Super Admin' 
                        : isOwner 
                        ? '🏢 Dueño Garaje' 
                        : '🚗 Conductor'}
                    </span>
                  </div>
                  <div className={`w-9 h-9 rounded-xl font-black flex items-center justify-center text-sm shadow-inner ${
                    isSuperAdmin
                      ? 'bg-amber-100 text-amber-800'
                      : isOwner
                      ? 'bg-teal-100 text-teal-800'
                      : 'bg-brand-100 text-brand-700'
                  }`}>
                    {user?.first_name ? user.first_name[0] : 'U'}
                  </div>
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 animate-scale-in z-50">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs text-slate-500">Sesión iniciada como</p>
                      <p className="text-sm font-bold text-slate-900 truncate">{user?.email}</p>
                      <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-md font-extrabold ${
                        isSuperAdmin 
                          ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                          : isOwner 
                          ? 'bg-teal-50 text-teal-800 border border-teal-200' 
                          : 'bg-slate-100 text-slate-700'
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
                            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <LayoutDashboard className="w-4 h-4 text-brand-600" />
                            Panel General
                          </Link>
                          <Link
                            to="/admin/parkings"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-amber-700 font-semibold hover:bg-amber-50"
                          >
                            <Crown className="w-4 h-4 text-amber-500" />
                            Alta y Baja de Garajes
                          </Link>
                          <Link
                            to="/admin/gate"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <ScanLine className="w-4 h-4 text-teal-600" />
                            Cámara QR & Garita
                          </Link>
                        </>
                      ) : isOwner ? (
                        <>
                          <Link
                            to="/admin/gate"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-teal-800 font-bold hover:bg-teal-50"
                          >
                            <ScanLine className="w-4 h-4 text-teal-600" />
                            Cámara QR & Control Garita
                          </Link>
                          <Link
                            to="/admin/spaces"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <Grid className="w-4 h-4 text-emerald-600" />
                            Plazas Vacantes en Vivo
                          </Link>
                          <Link
                            to="/admin/reservations"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <CalendarCheck className="w-4 h-4 text-brand-600" />
                            Caja & Historial
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link
                            to="/my-reservations"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <CalendarCheck className="w-4 h-4 text-brand-600" />
                            Mis Reservas
                          </Link>
                          <Link
                            to="/favorites"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <Bookmark className="w-4 h-4 text-brand-600" />
                            Mis Favoritos
                          </Link>
                        </>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <div className="px-3 py-1">
                        <p className="text-[10px] font-bold uppercase text-slate-400 px-1 mb-1">
                          Cambiar de rol demo:
                        </p>
                        <div className="grid grid-cols-3 gap-1">
                          <button
                            onClick={() => handleQuickDemo('driver')}
                            className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                          >
                            Conductor
                          </button>
                          <button
                            onClick={() => handleQuickDemo('owner')}
                            className="px-2 py-1 text-[11px] font-bold rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800"
                          >
                            Dueño
                          </button>
                          <button
                            onClick={() => handleQuickDemo('admin')}
                            className="px-2 py-1 text-[11px] font-bold rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800"
                          >
                            Super
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={handleLogout}
                        className="w-full text-left flex items-center gap-2 px-4 py-2 mt-1 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 pt-3 pb-6 space-y-3 animate-fade-in shadow-lg">
          <nav className="flex flex-col gap-1">
            {!isAdmin ? (
              <>
                <Link
                  to="/search"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-base font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Compass className="w-5 h-5 text-brand-600" />
                  Buscar Estacionamientos
                </Link>
                <Link
                  to="/my-reservations"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-base font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <CalendarCheck className="w-5 h-5 text-brand-600" />
                  Mis Reservas
                </Link>
                <Link
                  to="/favorites"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-base font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Bookmark className="w-5 h-5 text-brand-600" />
                  Favoritos
                </Link>
              </>
            ) : isSuperAdmin ? (
              <>
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-base font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <LayoutDashboard className="w-5 h-5 text-brand-600" />
                  Dashboard Global
                </Link>
                <Link
                  to="/admin/parkings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-base font-bold text-amber-700 hover:bg-amber-50"
                >
                  <Crown className="w-5 h-5 text-amber-500" />
                  Alta y Baja de Garajes
                </Link>
                <Link
                  to="/admin/gate"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-base font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <ScanLine className="w-5 h-5 text-teal-600" />
                  Control Accesos & QR
                </Link>
                <Link
                  to="/admin/spaces"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-base font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Grid className="w-5 h-5 text-brand-600" />
                  Plazas
                </Link>
                <Link
                  to="/admin/reservations"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-base font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <CalendarCheck className="w-5 h-5 text-brand-600" />
                  Reservas
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/admin/gate"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-base font-bold text-teal-800 hover:bg-teal-50"
                >
                  <ScanLine className="w-5 h-5 text-teal-600" />
                  Cámara QR & Garita (Tablet/Móvil)
                </Link>
                <Link
                  to="/admin/spaces"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-base font-bold text-emerald-800 hover:bg-emerald-50"
                >
                  <Grid className="w-5 h-5 text-emerald-600" />
                  Plazas Vacantes en Vivo
                </Link>
                <Link
                  to="/admin/reservations"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-base font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <CalendarCheck className="w-5 h-5 text-brand-600" />
                  Caja & Turnos
                </Link>
              </>
            )}
          </nav>

          <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
            {!isAuthenticated ? (
              <>
                <p className="text-[11px] font-bold uppercase text-slate-400 text-center">
                  Acceso Demo Rápido:
                </p>
                <div className="grid grid-cols-3 gap-2 pb-2">
                  <button
                    onClick={() => {
                      handleQuickDemo('driver');
                      setMobileMenuOpen(false);
                    }}
                    className="p-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 text-center"
                  >
                    Conductor
                  </button>
                  <button
                    onClick={() => {
                      handleQuickDemo('owner');
                      setMobileMenuOpen(false);
                    }}
                    className="p-2 text-xs font-bold rounded-xl bg-teal-50 text-teal-800 text-center border border-teal-200"
                  >
                    Dueño Garaje
                  </button>
                  <button
                    onClick={() => {
                      handleQuickDemo('admin');
                      setMobileMenuOpen(false);
                    }}
                    className="p-2 text-xs font-bold rounded-xl bg-amber-50 text-amber-800 text-center border border-amber-200"
                  >
                    Super Admin
                  </button>
                </div>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Iniciar Sesión
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" className="w-full">
                    Registrarse
                  </Button>
                </Link>
              </>
            ) : (
              <div className="space-y-2">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-sm font-bold text-slate-900">{user?.first_name} {user?.last_name}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                  <p className="text-[11px] font-extrabold text-teal-600 uppercase mt-1">
                    {isSuperAdmin ? 'Super Administrador (Ariel)' : isOwner ? 'Dueño Garaje' : 'Conductor'}
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
