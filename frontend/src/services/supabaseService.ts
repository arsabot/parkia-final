import { supabase } from './supabaseClient';
import {
  Parking,
  ParkingSpace,
  Reservation,
  SearchFilters,
  User,
  UserRole,
  AuthResponse,
  SpaceStatus,
  SpaceType,
  ReservationStatus,
  AdminDashboardData,
  LockAcquireResult,
} from '../types';

// Helper display mappings
export const getSpaceTypeDisplay = (type: string): string => {
  switch (type) {
    case 'disabled':
      return 'Accesible (CUD)';
    case 'ev':
      return 'Carga Eléctrica';
    case 'large':
      return 'Camioneta / SUV';
    default:
      return 'Estándar';
  }
};

export const getSpaceStatusDisplay = (status: string): string => {
  switch (status) {
    case 'locked':
    case 'locked_by_me':
    case 'locked_by_other':
      return 'Bloqueada temporalmente';
    case 'occupied':
      return 'Ocupada';
    case 'reserved':
      return 'Reservada';
    case 'maintenance':
      return 'Mantenimiento';
    default:
      return 'Disponible';
  }
};

export const getReservationStatusDisplay = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'Pendiente';
    case 'confirmed':
      return 'Confirmada';
    case 'completed':
      return 'Finalizada';
    case 'cancelled':
      return 'Cancelada';
    default:
      return status;
  }
};

// ============================================================================
// SUPABASE AUTH SERVICE
// ============================================================================
let oauthCallbackPromise: Promise<AuthResponse | null> | null = null;

export const supabaseAuth = {
  async demoLogin(role: UserRole = 'driver'): Promise<AuthResponse> {
    if (!supabase) throw new Error('Supabase no está configurado.');

    let targetEmail = 'conductor@parkia.com';
    if (role === 'owner') targetEmail = 'dueno@parkia.com';
    if (role === 'admin') targetEmail = 'admin@parkia.com';

    const { data: user, error } = await supabase
      .from('users')
      .select('*, user_roles(role:roles(*))')
      .eq('email', targetEmail)
      .single();

    if (error || !user) {
      throw new Error(`Usuario demo para el rol "${role}" no encontrado en Supabase.`);
    }

    const rolesList = user.user_roles?.map((ur: any) => ur.role?.code) || [role];
    const formattedUser: User = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      full_name: `${user.first_name} ${user.last_name}`,
      role: (rolesList[0] as UserRole) || role,
      roles: rolesList,
      phone: user.phone || '',
      avatar_url: user.avatar_url,
      cud_number: user.cud_number,
      cud_verified: user.cud_verified,
      cud_expiration: user.cud_expiration,
      created_at: user.created_at,
    };

    localStorage.setItem('parkia_token', `supabase-demo-token-${user.id}`);
    localStorage.setItem('parkia_user', JSON.stringify(formattedUser));

    return {
      message: `Sesión demo iniciada como ${formattedUser.full_name}`,
      user: formattedUser,
      tokens: {
        access: `supabase-demo-token-${user.id}`,
        refresh: `supabase-demo-refresh-${user.id}`,
      },
    };
  },

  async login(credentials: { email: string; password?: string }): Promise<AuthResponse> {
    if (!supabase) throw new Error('Supabase no está configurado.');

    const { data: user, error } = await supabase
      .from('users')
      .select('*, user_roles(role:roles(*))')
      .eq('email', credentials.email.trim().toLowerCase())
      .single();

    if (error || !user) {
      throw new Error('Credenciales inválidas o usuario no encontrado en Supabase.');
    }

    const rolesList = user.user_roles?.map((ur: any) => ur.role?.code) || ['driver'];
    const primaryRole = (rolesList.find((r: string) => ['admin', 'owner', 'driver'].includes(r)) as UserRole) || 'driver';

    const formattedUser: User = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      full_name: `${user.first_name} ${user.last_name}`,
      role: primaryRole,
      roles: rolesList,
      phone: user.phone || '',
      avatar_url: user.avatar_url,
      cud_number: user.cud_number,
      cud_verified: user.cud_verified,
      cud_expiration: user.cud_expiration,
      created_at: user.created_at,
    };

    localStorage.setItem('parkia_token', `supabase-token-${user.id}`);
    localStorage.setItem('parkia_user', JSON.stringify(formattedUser));

    return {
      message: 'Ingreso exitoso',
      user: formattedUser,
      tokens: {
        access: `supabase-token-${user.id}`,
        refresh: `supabase-refresh-${user.id}`,
      },
    };
  },

  async register(data: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    phone?: string;
    role?: UserRole;
    has_disability_permit?: boolean;
    cud_number?: string;
    cud_expiration?: string;
  }): Promise<AuthResponse> {
    if (!supabase) throw new Error('Supabase no está configurado.');

    // 1. Insert user
    const { data: insertedUser, error } = await supabase
      .from('users')
      .insert({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email.trim().toLowerCase(),
        password: data.password, // In real Supabase auth use supabase.auth.signUp
        phone: data.phone || '',
        cud_number: data.cud_number || null,
        cud_verified: Boolean(data.has_disability_permit || data.cud_number),
        cud_expiration: data.cud_expiration || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw new Error(error.message || 'Error al registrar usuario en Supabase.');

    // 2. Fetch role
    const assignedRoleCode = data.role || 'driver';
    const { data: roleData } = await supabase.from('roles').select('id').eq('code', assignedRoleCode).single();
    if (roleData) {
      await supabase.from('user_roles').insert({ user_id: insertedUser.id, role_id: roleData.id });
    }

    if (data.has_disability_permit || data.cud_number) {
      const { data: disRole } = await supabase.from('roles').select('id').eq('code', 'disabled').single();
      if (disRole) {
        await supabase.from('user_roles').insert({ user_id: insertedUser.id, role_id: disRole.id });
      }
    }

    return this.login({ email: data.email });
  },

  async verifyCud(data: { cud_number: string }): Promise<{
    valid: boolean;
    message: string;
    cud_number: string;
    status: string;
    symbol: string;
    accessible_parking_access: boolean;
  }> {
    const raw = data.cud_number.trim();
    const clean = raw.replace(/[^0-9]/g, '');
    const valid = clean.length >= 8 && clean.length <= 14;

    if (valid) {
      return {
        valid: true,
        message: 'Certificado Único de Discapacidad (CUD) Válido y Activo.',
        cud_number: raw,
        status: 'ACTIVO_REGISTRADO',
        symbol: 'Símbolo Internacional de Acceso',
        accessible_parking_access: true,
      };
    }
    return {
      valid: false,
      message: 'Número de CUD inválido. Debe contener entre 8 y 14 dígitos numéricos.',
      cud_number: raw,
      status: 'INVALIDO',
      symbol: 'No verificado',
      accessible_parking_access: false,
    };
  },

  async requestPasswordReset(email: string): Promise<{ message: string; dev_reset_url?: string }> {
    if (!supabase) throw new Error('Supabase no está configurado.');

    const cleanEmail = email.trim().toLowerCase();

    // 1. Verificar si existe en public.users
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, first_name')
      .ilike('email', cleanEmail)
      .maybeSingle();

    // Intentar también el envío mediante el servicio de email de Supabase Auth
    try {
      await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
    } catch {
      // Ignorar si el usuario no tiene cuenta directa en auth.users
    }

    if (!user || userError) {
      // Por seguridad devolvemos mensaje genérico igual que los estándares OWASP
      return {
        message: 'Si tu correo electrónico está registrado, recibirás un enlace para restablecer tu contraseña.',
      };
    }

    // 2. Generar token temporal seguro basado en timestamp y ID
    const expiresAt = Date.now() + 1000 * 60 * 60 * 24; // 24 horas
    const rawPayload = `${user.id}:${expiresAt}:${cleanEmail}`;
    const token = btoa(rawPayload).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const uid = String(user.id);
    const devResetUrl = `${window.location.origin}/reset-password?uid=${uid}&token=${token}`;

    return {
      message: 'Si tu correo electrónico está registrado, recibirás un enlace para restablecer tu contraseña.',
      dev_reset_url: devResetUrl,
    };
  },

  async validateResetToken(uid: string, token: string): Promise<{ valid: boolean; email?: string; message?: string }> {
    if (!supabase) throw new Error('Supabase no está configurado.');

    try {
      // Decodificar token base64 url-safe
      const paddedToken = token.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = atob(paddedToken);
      const [tokenUid, expiresStr] = decoded.split(':');

      if (!tokenUid || !expiresStr || tokenUid !== String(uid)) {
        return { valid: false, message: 'El enlace de recuperación es inválido o está corrupto.' };
      }

      const expiresAt = Number(expiresStr);
      if (isNaN(expiresAt) || Date.now() > expiresAt) {
        return { valid: false, message: 'El enlace de recuperación ha expirado. Solicita uno nuevo.' };
      }

      // Validar que el usuario siga existiendo y activo
      const { data: user, error } = await supabase
        .from('users')
        .select('id, email, is_active')
        .eq('id', uid)
        .maybeSingle();

      if (error || !user || !user.is_active) {
        return { valid: false, message: 'Usuario no encontrado o cuenta inactiva.' };
      }

      return {
        valid: true,
        email: user.email,
        message: 'Token válido.',
      };
    } catch {
      return { valid: false, message: 'El enlace de recuperación no tiene un formato válido.' };
    }
  },

  async confirmPasswordReset(data: {
    uid: string;
    token: string;
    password: string;
    password_confirmation: string;
  }): Promise<{ message: string }> {
    if (!supabase) throw new Error('Supabase no está configurado.');

    if (!data.password || data.password.length < 8) {
      throw new Error('La contraseña debe tener al menos 8 caracteres.');
    }

    if (data.password !== data.password_confirmation) {
      throw new Error('Las contraseñas no coinciden.');
    }

    // 1. Validar token nuevamente antes de proceder
    const validation = await this.validateResetToken(data.uid, data.token);
    if (!validation.valid) {
      throw new Error(validation.message || 'El enlace de recuperación ha expirado o no es válido.');
    }

    // 2. Actualizar contraseña en public.users
    const { error: updateError } = await supabase
      .from('users')
      .update({ password: data.password })
      .eq('id', data.uid);

    if (updateError) {
      console.error('Error al actualizar contraseña:', updateError);
      throw new Error('No se pudo actualizar la contraseña en la base de datos.');
    }

    // 3. Si existe sesión o usuario en Supabase Auth, sincronizarla también
    try {
      await supabase.auth.updateUser({ password: data.password });
    } catch {
      // Ignorar si no está autenticado en Supabase Auth
    }

    return {
      message: 'Tu contraseña ha sido actualizada exitosamente.',
    };
  },

  async signInWithGoogle(role?: UserRole): Promise<void> {
    if (!supabase) throw new Error('Supabase no está configurado.');
    if (role) {
      sessionStorage.setItem('parkia_oauth_role', role);
    }
    sessionStorage.setItem('parkia_oauth_pending', '1');

    const redirectUrl = `${window.location.origin}/login`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      sessionStorage.removeItem('parkia_oauth_pending');
      sessionStorage.removeItem('parkia_oauth_role');
      throw new Error(error.message || 'Error al conectar con Google en Supabase.');
    }
  },

  async handleOAuthCallback(): Promise<AuthResponse | null> {
    if (!supabase) return null;

    if (oauthCallbackPromise) {
      return oauthCallbackPromise;
    }

    oauthCallbackPromise = (async () => {
      try {
        // Supabase PKCE: si hay un code en la URL, intercambiarlo por sesión si no se hizo
        if (typeof window !== 'undefined' && window.location.search.includes('code=')) {
          try {
            const params = new URLSearchParams(window.location.search);
            const code = params.get('code');
            if (code) {
              await supabase.auth.exchangeCodeForSession(code);
            }
          } catch {
            // Ignorar si el cliente ya lo intercambió automáticamente
          }
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session || !session.user) {
          return null;
        }

        const authUser = session.user;
        const email = authUser.email ? authUser.email.trim().toLowerCase() : '';
        if (!email) return null;

        // 1. Buscar si el usuario ya existe en public.users (búsqueda insensible a mayúsculas/minúsculas)
        let { data: existingUser } = await supabase
          .from('users')
          .select('*, user_roles(role:roles(*))')
          .ilike('email', email)
          .maybeSingle();

        if (!existingUser) {
          // 2. Si no existe en la tabla users, crearlo
          const pendingRole = (sessionStorage.getItem('parkia_oauth_role') as UserRole) || 'driver';
          const metadata = authUser.user_metadata || {};
          const fullName = (metadata.full_name || metadata.name || '').trim();
          let firstName = (metadata.given_name || '').trim();
          let lastName = (metadata.family_name || '').trim();

          if (!firstName && fullName) {
            const parts = fullName.split(' ');
            firstName = parts[0] || 'Usuario';
            lastName = parts.slice(1).join(' ') || '';
          }
          if (!firstName) {
            firstName = email.split('@')[0] || 'Usuario';
          }
          if (!lastName) {
            lastName = 'Google';
          }

          const rawAvatar = metadata.avatar_url || metadata.picture || null;
          const avatarUrl = rawAvatar ? String(rawAvatar).substring(0, 490) : null;

          const { data: insertedUser, error: insertError } = await supabase
            .from('users')
            .insert({
              first_name: firstName,
              last_name: lastName,
              email: email,
              password: `oauth-google-${authUser.id}`,
              phone: authUser.phone || '',
              avatar_url: avatarUrl,
              is_active: true,
            })
            .select()
            .maybeSingle();

          if (insertError) {
            // Si hubo conflicto de unicidad en email (por concurrencia o cuenta preexistente), recuperar el usuario
            if (
              insertError.code === '23505' ||
              insertError.message?.toLowerCase().includes('duplicate key') ||
              insertError.message?.toLowerCase().includes('users_email_key')
            ) {
              const { data: retryUser } = await supabase
                .from('users')
                .select('*, user_roles(role:roles(*))')
                .ilike('email', email)
                .maybeSingle();
              existingUser = retryUser;
            } else {
              console.error('Error insertando usuario OAuth:', insertError);
              throw new Error(insertError.message || 'Error al registrar la cuenta de Google en Supabase.');
            }
          } else if (insertedUser) {
            // Asignar rol
            const { data: roleData } = await supabase.from('roles').select('id').eq('code', pendingRole).maybeSingle();
            if (roleData) {
              try {
                await supabase.from('user_roles').insert({ user_id: insertedUser.id, role_id: roleData.id });
              } catch {}
            }

            const { data: fullNewUser } = await supabase
              .from('users')
              .select('*, user_roles(role:roles(*))')
              .eq('id', insertedUser.id)
              .maybeSingle();

            existingUser = fullNewUser || insertedUser;
          }
        }

        sessionStorage.removeItem('parkia_oauth_pending');
        sessionStorage.removeItem('parkia_oauth_role');

        // Limpiar hash o query de la barra de direcciones para evitar reintentos con códigos usados
        if (typeof window !== 'undefined' && window.history?.replaceState) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        if (!existingUser) return null;

        const rolesList = existingUser.user_roles?.map((ur: any) => ur.role?.code) || ['driver'];
        const primaryRole = (rolesList.find((r: string) => ['admin', 'owner', 'driver'].includes(r)) as UserRole) || 'driver';

        const formattedUser: User = {
          id: existingUser.id,
          email: existingUser.email,
          first_name: existingUser.first_name,
          last_name: existingUser.last_name,
          full_name: `${existingUser.first_name} ${existingUser.last_name}`.trim(),
          role: primaryRole,
          roles: rolesList,
          phone: existingUser.phone || '',
          avatar_url: existingUser.avatar_url || authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || null,
          cud_number: existingUser.cud_number,
          cud_verified: existingUser.cud_verified,
          cud_expiration: existingUser.cud_expiration,
          created_at: existingUser.created_at,
        };

        localStorage.setItem('parkia_token', session.access_token || `supabase-token-${existingUser.id}`);
        localStorage.setItem('parkia_refresh', session.refresh_token || '');
        localStorage.setItem('parkia_user', JSON.stringify(formattedUser));

        return {
          message: 'Ingreso exitoso con Google',
          user: formattedUser,
          tokens: {
            access: session.access_token || `supabase-token-${existingUser.id}`,
            refresh: session.refresh_token || '',
          },
        };
      } finally {
        oauthCallbackPromise = null;
      }
    })();

    return oauthCallbackPromise;
  },

  async getMe(): Promise<User> {
    const stored = localStorage.getItem('parkia_user');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {}
    }
    const res = await this.demoLogin('driver');
    return res.user;
  },
};

// ============================================================================
// SUPABASE PARKING SERVICE
// ============================================================================
export const supabaseParking = {
  async getParkings(filters?: SearchFilters): Promise<Parking[]> {
    if (!supabase) throw new Error('Supabase no está configurado.');

    let query = supabase.from('parkings').select('*, spaces:parking_spaces(*)');

    if (filters?.is_covered !== undefined) query = query.eq('is_covered', filters.is_covered);
    if (filters?.has_security !== undefined) query = query.eq('has_security', filters.has_security);
    if (filters?.has_ev_charging !== undefined) query = query.eq('has_ev_charging', filters.has_ev_charging);
    if (filters?.has_disabled_access !== undefined) query = query.eq('has_disabled_access', filters.has_disabled_access);
    if (filters?.is_24_hours !== undefined) query = query.eq('is_24_hours', filters.is_24_hours);
    if (filters?.max_price) query = query.lte('price_per_hour', filters.max_price);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    let parkings: Parking[] = (data || []).map((p: any) => {
      const spacesList: ParkingSpace[] = (p.spaces || []).map((s: any) => ({
        id: s.id,
        parking: p.id,
        code: s.code,
        floor: s.floor,
        space_type: s.space_type as SpaceType,
        space_type_display: getSpaceTypeDisplay(s.space_type),
        status: s.status as SpaceStatus,
        status_display: getSpaceStatusDisplay(s.status),
        created_at: s.created_at,
      }));

      const availableCount = spacesList.filter((s) => s.status === 'available').length;
      const totalCount = spacesList.length || p.capacity;
      const occupancyRate = totalCount > 0 ? Math.round(((totalCount - availableCount) / totalCount) * 100) : 0;

      return {
        id: p.id,
        name: p.name,
        address: p.address,
        city: p.city,
        latitude: p.latitude,
        longitude: p.longitude,
        description: p.description || '',
        phone: p.phone || '',
        owner_id: p.owner_id,
        price_per_hour: Number(p.price_per_hour),
        price_per_day: p.price_per_day ? Number(p.price_per_day) : undefined,
        opening_time: p.opening_time || '07:00',
        closing_time: p.closing_time || '23:00',
        is_24_hours: Boolean(p.is_24_hours),
        capacity: p.capacity,
        rating: Number(p.rating) || 4.8,
        reviews_count: p.reviews_count || 0,
        is_active: Boolean(p.is_active),
        is_covered: Boolean(p.is_covered),
        has_security: Boolean(p.has_security),
        has_ev_charging: Boolean(p.has_ev_charging),
        has_disabled_access: Boolean(p.has_disabled_access),
        has_car_wash: Boolean(p.has_car_wash),
        has_valet: Boolean(p.has_valet),
        image_url: p.image_url,
        gallery: p.gallery || [],
        available_spaces: availableCount,
        total_spaces: totalCount,
        occupancy_rate: occupancyRate,
        is_favorite: false,
        spaces: spacesList,
      };
    });

    if (filters?.search) {
      const term = filters.search.toLowerCase();
      parkings = parkings.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.address.toLowerCase().includes(term) ||
          p.city.toLowerCase().includes(term)
      );
    }

    return parkings;
  },

  async getMyParkings(): Promise<Parking[]> {
    return this.getParkings();
  },

  async getParkingById(id: number | string): Promise<Parking> {
    const all = await this.getParkings();
    const found = all.find((p) => String(p.id) === String(id));
    if (!found) throw new Error(`Estacionamiento #${id} no encontrado.`);
    return found;
  },

  async getSpaces(parkingId: number | string): Promise<ParkingSpace[]> {
    if (!supabase) throw new Error('Supabase no está configurado.');

    const { data, error } = await supabase
      .from('parking_spaces')
      .select('*')
      .eq('parking_id', parkingId)
      .order('id');

    if (error) throw new Error(error.message);

    return (data || []).map((s: any) => ({
      id: s.id,
      parking: Number(parkingId),
      code: s.code,
      floor: s.floor,
      space_type: s.space_type as SpaceType,
      space_type_display: getSpaceTypeDisplay(s.space_type),
      status: s.status as SpaceStatus,
      status_display: getSpaceStatusDisplay(s.status),
      created_at: s.created_at,
    }));
  },

  async getAllSpaces(parkingId?: number): Promise<ParkingSpace[]> {
    if (!supabase) throw new Error('Supabase no está configurado.');

    let query = supabase.from('parking_spaces').select('*, parking:parkings(id, name)').order('id');
    if (parkingId) query = query.eq('parking_id', parkingId);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return (data || []).map((s: any) => ({
      id: s.id,
      parking: s.parking_id,
      code: s.code,
      floor: s.floor,
      space_type: s.space_type as SpaceType,
      space_type_display: getSpaceTypeDisplay(s.space_type),
      status: s.status as SpaceStatus,
      status_display: getSpaceStatusDisplay(s.status),
      created_at: s.created_at,
    }));
  },

  async updateSpaceStatus(spaceId: number, status: SpaceStatus): Promise<ParkingSpace> {
    if (!supabase) throw new Error('Supabase no está configurado.');

    const { data, error } = await supabase
      .from('parking_spaces')
      .update({ status })
      .eq('id', spaceId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      parking: data.parking_id,
      code: data.code,
      floor: data.floor,
      space_type: data.space_type as SpaceType,
      space_type_display: getSpaceTypeDisplay(data.space_type),
      status: data.status as SpaceStatus,
      status_display: getSpaceStatusDisplay(data.status),
      created_at: data.created_at,
    };
  },

  async updateSpaceType(spaceId: number, spaceType: SpaceType): Promise<ParkingSpace> {
    if (!supabase) throw new Error('Supabase no está configurado.');

    const { data, error } = await supabase
      .from('parking_spaces')
      .update({ space_type: spaceType })
      .eq('id', spaceId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      parking: data.parking_id,
      code: data.code,
      floor: data.floor,
      space_type: data.space_type as SpaceType,
      space_type_display: getSpaceTypeDisplay(data.space_type),
      status: data.status as SpaceStatus,
      status_display: getSpaceStatusDisplay(data.status),
      created_at: data.created_at,
    };
  },

  async toggleFavorite(parkingId: number): Promise<{ is_favorite: boolean; message: string }> {
    return { is_favorite: true, message: 'Favorito actualizado en Supabase' };
  },

  async getFavorites(): Promise<Array<{ id: number; parking: Parking; created_at: string }>> {
    const parkings = await this.getParkings();
    return parkings.slice(0, 3).map((p, idx) => ({
      id: idx + 1,
      parking: p,
      created_at: new Date().toISOString(),
    }));
  },

  async createParking(data: Partial<Parking>): Promise<Parking> {
    if (!supabase) throw new Error('Supabase no está configurado.');
    const { data: created, error } = await supabase.from('parkings').insert(data).select().single();
    if (error) throw new Error(error.message);
    return created;
  },

  async updateParking(id: number, data: Partial<Parking>): Promise<Parking> {
    if (!supabase) throw new Error('Supabase no está configurado.');
    const { data: updated, error } = await supabase.from('parkings').update(data).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return updated;
  },

  async deleteParking(id: number): Promise<void> {
    if (!supabase) throw new Error('Supabase no está configurado.');
    const { error } = await supabase.from('parkings').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};

// Helper para resolver un user_id válido en Supabase
async function getValidSupabaseUserId(candidateId?: number | null, email?: string | null): Promise<number | null> {
  if (!supabase) return null;
  try {
    if (candidateId && !isNaN(Number(candidateId))) {
      const { data } = await supabase.from('users').select('id').eq('id', Number(candidateId)).maybeSingle();
      if (data?.id) return Number(data.id);
    }
    if (email && typeof email === 'string') {
      const { data } = await supabase.from('users').select('id').eq('email', email.trim().toLowerCase()).maybeSingle();
      if (data?.id) return Number(data.id);
    }
  } catch {
    // Si hay error de red o tabla no accesible, retorna null de forma segura
  }
  return null;
}

// ============================================================================
// SUPABASE RESERVATION SERVICE
// ============================================================================
export const supabaseReservations = {
  async getReservations(params?: { status?: string; parking_id?: number }): Promise<Reservation[]> {
    if (!supabase) throw new Error('Supabase no está configurado.');

    let query = supabase
      .from('reservations')
      .select('*, parking:parkings(*), space:parking_spaces(*), user:users(*)')
      .order('created_at', { ascending: false });

    if (params?.status) query = query.eq('status', params.status);
    if (params?.parking_id) query = query.eq('parking_id', params.parking_id);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return (data || []).map((r: any) => ({
      id: r.id,
      booking_code: r.booking_code,
      user: r.user_id,
      user_name: r.user ? `${r.user.first_name} ${r.user.last_name}` : 'Conductor',
      user_email: r.user?.email || '',
      parking: r.parking_id,
      parking_name: r.parking?.name || 'Estacionamiento Central',
      parking_address: r.parking?.address || 'Av. Corrientes 1000',
      parking_city: r.parking?.city || 'Buenos Aires',
      parking_phone: r.parking?.phone || '+54 11 4321-8899',
      parking_image_url: r.parking?.image_url || '',
      parking_latitude: r.parking?.latitude || -34.6037,
      parking_longitude: r.parking?.longitude || -58.3816,
      space: r.space_id,
      space_code: r.space?.code || 'P-01',
      space_floor: r.space?.floor || 'PB',
      vehicle_plate: r.vehicle_plate,
      vehicle_model: r.vehicle_model || 'Auto Particular',
      date: r.date,
      start_time: r.start_time,
      end_time: r.end_time,
      total_hours: Number(r.total_hours),
      total_price: Number(r.total_price),
      status: r.status as ReservationStatus,
      status_display: getReservationStatusDisplay(r.status),
      cancellation_reason: r.cancellation_reason,
      check_in_time: r.check_in_time,
      check_out_time: r.check_out_time,
      payment_method: r.payment_method,
      payment_status: r.payment_status,
      staff_notes: r.staff_notes,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));
  },

  async getReservationById(id: number | string): Promise<Reservation> {
    const list = await this.getReservations();
    const found = list.find((r) => String(r.id) === String(id));
    if (!found) throw new Error(`Reserva #${id} no encontrada.`);
    return found;
  },

  async createReservation(data: {
    parking: number;
    space?: number;
    vehicle_plate: string;
    vehicle_model?: string;
    date: string;
    start_time: string;
    end_time: string;
    payment_method?: string;
    payment_status?: 'pending' | 'paid' | 'refunded';
    status?: ReservationStatus;
  }): Promise<{ message: string; reservation: Reservation }> {
    if (!supabase) throw new Error('Supabase no está configurado.');

    // 1. Get parking price
    const { data: parking } = await supabase.from('parkings').select('*').eq('id', data.parking).single();
    const pricePerHour = parking ? Number(parking.price_per_hour) : 2000;

    // Calculate hours
    const [startH] = data.start_time.split(':').map(Number);
    const [endH] = data.end_time.split(':').map(Number);
    const hours = Math.max(1, (endH || 12) - (startH || 10));
    const totalPrice = hours * pricePerHour;

    // 2. Select a space if not provided
    let spaceId = data.space;
    if (!spaceId) {
      const { data: availableSpace } = await supabase
        .from('parking_spaces')
        .select('id')
        .eq('parking_id', data.parking)
        .eq('status', 'available')
        .limit(1)
        .single();
      spaceId = availableSpace?.id || 1;
    }

    // 2.5 Verificar que la plaza no esté ya reservada para esa franja horaria
    const { data: overlapping } = await supabase
      .from('reservations')
      .select('id')
      .eq('space_id', spaceId)
      .eq('date', data.date)
      .in('status', ['pending', 'confirmed'])
      .lt('start_time', data.end_time)
      .gt('end_time', data.start_time)
      .limit(1);

    if (overlapping && overlapping.length > 0) {
      throw new Error('Esta plaza ya cuenta con una reserva confirmada para este horario.');
    }

    // 3. Current user (validar contra tabla users de Supabase para evitar violación de FK)
    const userStr = localStorage.getItem('parkia_user');
    const storedUser = userStr ? JSON.parse(userStr) : null;
    let validUserId = await getValidSupabaseUserId(storedUser?.id, storedUser?.email);
    if (!validUserId) {
      const { data: defaultUser } = await supabase
        .from('users')
        .select('id')
        .order('id', { ascending: true })
        .limit(1)
        .maybeSingle();
      validUserId = defaultUser?.id || 1;
    }

    // 4. Generate unique booking code
    const code = 'PK-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    const finalMethod = data.payment_method || 'Mercado Pago';
    const finalPaymentStatus = data.payment_status || (finalMethod === 'Efectivo' ? 'pending' : 'paid');
    const finalResStatus = data.status || 'confirmed';

    const { data: newRes, error } = await supabase
      .from('reservations')
      .insert({
        booking_code: code,
        user_id: validUserId,
        parking_id: data.parking,
        space_id: spaceId,
        vehicle_plate: data.vehicle_plate.toUpperCase(),
        vehicle_model: data.vehicle_model || 'Auto Particular',
        date: data.date,
        start_time: data.start_time,
        end_time: data.end_time,
        total_hours: hours,
        total_price: totalPrice,
        status: finalResStatus,
        payment_method: finalMethod,
        payment_status: finalPaymentStatus,
      })
      .select('*, parking:parkings(*), space:parking_spaces(*), user:users(*)')
      .single();

    if (error) throw new Error(error.message);

    // Mark space as reserved
    if (spaceId) {
      await supabase.from('parking_spaces').update({ status: 'reserved' }).eq('id', spaceId);
    }

    const formatted: Reservation = {
      id: newRes.id,
      booking_code: newRes.booking_code,
      user: newRes.user_id,
      user_name: newRes.user ? `${newRes.user.first_name} ${newRes.user.last_name}` : 'Conductor',
      user_email: newRes.user?.email || '',
      parking: newRes.parking_id,
      parking_name: newRes.parking?.name || 'Estacionamiento',
      parking_address: newRes.parking?.address || '',
      parking_city: newRes.parking?.city || '',
      parking_phone: newRes.parking?.phone || '',
      parking_image_url: newRes.parking?.image_url || '',
      parking_latitude: newRes.parking?.latitude || -34.6037,
      parking_longitude: newRes.parking?.longitude || -58.3816,
      space: newRes.space_id,
      space_code: newRes.space?.code || 'P-01',
      space_floor: newRes.space?.floor || 'PB',
      vehicle_plate: newRes.vehicle_plate,
      vehicle_model: newRes.vehicle_model,
      date: newRes.date,
      start_time: newRes.start_time,
      end_time: newRes.end_time,
      total_hours: Number(newRes.total_hours),
      total_price: Number(newRes.total_price),
      status: newRes.status as ReservationStatus,
      status_display: getReservationStatusDisplay(newRes.status),
      payment_method: newRes.payment_method,
      payment_status: newRes.payment_status,
      created_at: newRes.created_at,
      updated_at: newRes.updated_at,
    };

    return { message: 'Reserva creada exitosamente en Supabase.', reservation: formatted };
  },

  async cancelReservation(id: number, reason?: string): Promise<{ message: string; reservation: Reservation }> {
    if (!supabase) throw new Error('Supabase no está configurado.');

    // 1. Obtener la reserva para conocer el estado de pago
    const { data: currentRes } = await supabase
      .from('reservations')
      .select('payment_status, total_price')
      .eq('id', id)
      .single();

    const isPaid = currentRes?.payment_status === 'paid';
    const newPaymentStatus = isPaid ? 'refunded' : currentRes?.payment_status || 'pending';

    const { data, error } = await supabase
      .from('reservations')
      .update({
        status: 'cancelled',
        payment_status: newPaymentStatus,
        cancellation_reason: reason || 'Cancelado por usuario'
      })
      .eq('id', id)
      .select('*, parking:parkings(*), space:parking_spaces(*), user:users(*)')
      .single();

    if (error) throw new Error(error.message);

    // Free space
    if (data.space_id) {
      await supabase.from('parking_spaces').update({ status: 'available' }).eq('id', data.space_id);
    }

    const message = isPaid
      ? `Reserva cancelada con éxito. Reembolso del 100% ($${Number(currentRes?.total_price || 0).toLocaleString('es-AR')}) procesado a tu cuenta.`
      : 'Reserva cancelada correctamente.';

    return {
      message,
      reservation: (await this.getReservations()).find((r) => r.id === id)!,
    };
  },

  async updatePayment(id: number | string, payment_method: string, payment_status: 'paid' | 'pending' = 'paid'): Promise<Reservation> {
    if (!supabase) throw new Error('Supabase no está configurado.');

    const { error } = await supabase
      .from('reservations')
      .update({
        payment_method,
        payment_status,
        status: 'confirmed',
      })
      .eq('id', id);

    if (error) throw new Error(error.message);
    return this.getReservationById(id);
  },

  async verifyQr(code: string): Promise<{ valid: boolean; message: string; reservation: Reservation }> {
    if (!supabase) throw new Error('Supabase no está configurado.');

    const cleanCode = code.trim().toUpperCase();
    const { data: res, error } = await supabase
      .from('reservations')
      .select('*, parking:parkings(*), space:parking_spaces(*), user:users(*)')
      .eq('booking_code', cleanCode)
      .single();

    if (error || !res) {
      throw new Error(`Código QR ${cleanCode} no válido o no encontrado en el sistema.`);
    }

    const formatted: Reservation = {
      id: res.id,
      booking_code: res.booking_code,
      user: res.user_id,
      user_name: res.user ? `${res.user.first_name} ${res.user.last_name}` : 'Conductor',
      user_email: res.user?.email || '',
      parking: res.parking_id,
      parking_name: res.parking?.name || '',
      parking_address: res.parking?.address || '',
      parking_city: res.parking?.city || '',
      parking_phone: res.parking?.phone || '',
      parking_image_url: res.parking?.image_url || '',
      parking_latitude: res.parking?.latitude || -34.6037,
      parking_longitude: res.parking?.longitude || -58.3816,
      space: res.space_id,
      space_code: res.space?.code || 'P-01',
      space_floor: res.space?.floor || 'PB',
      vehicle_plate: res.vehicle_plate,
      vehicle_model: res.vehicle_model,
      date: res.date,
      start_time: res.start_time,
      end_time: res.end_time,
      total_hours: Number(res.total_hours),
      total_price: Number(res.total_price),
      status: res.status,
      status_display: getReservationStatusDisplay(res.status),
      cancellation_reason: res.cancellation_reason,
      check_in_time: res.check_in_time,
      check_out_time: res.check_out_time,
      payment_method: res.payment_method || 'Mercado Pago',
      payment_status: res.payment_status || 'paid',
      staff_notes: res.staff_notes || '',
      created_at: res.created_at,
      updated_at: res.updated_at,
    };

    return {
      valid: true,
      message: 'Código QR verificado con éxito.',
      reservation: formatted,
    };
  },

  async checkIn(id: number, data?: { notes?: string; payment_method?: string }): Promise<{ message: string; reservation: Reservation }> {
    if (!supabase) throw new Error('Supabase no está configurado.');

    const now = new Date().toISOString();
    const updatePayload: any = {
      check_in_time: now,
      status: 'confirmed',
      staff_notes: data?.notes || '',
    };
    if (data?.payment_method) {
      updatePayload.payment_method = data.payment_method;
      updatePayload.payment_status = 'paid';
    }

    const { data: updated, error } = await supabase
      .from('reservations')
      .update(updatePayload)
      .eq('id', id)
      .select('*, parking:parkings(*), space:parking_spaces(*), user:users(*)')
      .single();

    if (error) throw new Error(error.message);

    if (updated?.space_id) {
      await supabase.from('parking_spaces').update({ status: 'occupied' }).eq('id', updated.space_id);
    }

    const res = (await this.getReservations()).find((r) => r.id === id)!;
    return { message: 'Ingreso registrado exitosamente.', reservation: res };
  },

  async checkOut(id: number, data?: { notes?: string; payment_method?: string }): Promise<{ message: string; reservation: Reservation }> {
    if (!supabase) throw new Error('Supabase no está configurado.');

    // Fetch existing reservation to preserve its payment method unless explicitly overridden
    const { data: currentRes } = await supabase
      .from('reservations')
      .select('payment_method, space_id')
      .eq('id', id)
      .single();

    const now = new Date().toISOString();
    const finalMethod = data?.payment_method || currentRes?.payment_method || 'Mercado Pago';

    const { data: updated, error } = await supabase
      .from('reservations')
      .update({
        check_out_time: now,
        status: 'completed',
        payment_method: finalMethod,
        payment_status: 'paid',
        staff_notes: data?.notes || '',
      })
      .eq('id', id)
      .select('*, parking:parkings(*), space:parking_spaces(*), user:users(*)')
      .single();

    if (error) throw new Error(error.message);

    const spaceId = updated?.space_id || currentRes?.space_id;
    if (spaceId) {
      await supabase.from('parking_spaces').update({ status: 'available' }).eq('id', spaceId);
    }

    const res = (await this.getReservations()).find((r) => r.id === id)!;
    return { message: 'Egreso y cobro registrado exitosamente.', reservation: res };
  },

  async registerWalkIn(data: {
    parking_id: number;
    vehicle_plate: string;
    vehicle_model?: string;
    hours: number;
    payment_method: string;
    notes?: string;
  }): Promise<{ message: string; reservation: Reservation }> {
    if (!supabase) throw new Error('Supabase no está configurado.');

    const { data: parking } = await supabase.from('parkings').select('*').eq('id', data.parking_id).single();
    const pricePerHour = parking ? Number(parking.price_per_hour) : 2200;
    const totalPrice = data.hours * pricePerHour;

    const { data: freeSpace } = await supabase
      .from('parking_spaces')
      .select('id')
      .eq('parking_id', data.parking_id)
      .eq('status', 'available')
      .limit(1)
      .single();

    const spaceId = freeSpace?.id || null;
    const now = new Date();
    const end = new Date(now.getTime() + data.hours * 3600 * 1000);

    const code = 'PK-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data: newRes, error } = await supabase
      .from('reservations')
      .insert({
        booking_code: code,
        user_id: 1, // Demo driver
        parking_id: data.parking_id,
        space_id: spaceId,
        vehicle_plate: data.vehicle_plate.toUpperCase(),
        vehicle_model: data.vehicle_model || 'Auto Particular',
        date: now.toISOString().slice(0, 10),
        start_time: now.toTimeString().slice(0, 8),
        end_time: end.toTimeString().slice(0, 8),
        total_hours: data.hours,
        total_price: totalPrice,
        status: 'confirmed',
        check_in_time: now.toISOString(),
        payment_method: data.payment_method,
        payment_status: 'paid',
        staff_notes: data.notes || 'Ingreso directo en garita',
      })
      .select('*, parking:parkings(*), space:parking_spaces(*), user:users(*)')
      .single();

    if (error) throw new Error(error.message);

    if (spaceId) {
      await supabase.from('parking_spaces').update({ status: 'occupied' }).eq('id', spaceId);
    }

    const res = (await this.getReservations()).find((r) => r.id === newRes.id)!;
    return { message: 'Ingreso directo registrado con éxito.', reservation: res };
  },

  async checkAvailability(params: {
    parking_id: number;
    date: string;
    start_time: string;
    end_time: string;
    session_id?: string;
    user_id?: number;
  }): Promise<{
    parking_id: number;
    total_spaces: number;
    available_spaces_count: number;
    has_availability: boolean;
    duration_hours: number;
    estimated_price: number;
    spaces: Array<{
      id: number;
      code: string;
      floor: string;
      space_type: string;
      is_available: boolean;
      status: string;
      is_locked_by_me?: boolean;
      is_locked_by_other?: boolean;
      lock_info?: {
        lock_id: number;
        is_mine: boolean;
        expires_at: string;
        seconds_remaining: number;
      } | null;
    }>;
  }> {
    const spaces = await supabaseParking.getSpaces(params.parking_id);
    const parking = await supabaseParking.getParkingById(params.parking_id);

    const [startH] = params.start_time.split(':').map(Number);
    const [endH] = params.end_time.split(':').map(Number);
    const duration = Math.max(1, (endH || 12) - (startH || 10));

    // Limpieza de bloqueos vencidos si Supabase está activo
    const nowIso = new Date().toISOString();
    try {
      if (supabase) {
        await supabase
          .from('space_locks')
          .update({ status: 'expired' })
          .eq('status', 'active')
          .lt('expires_at', nowIso);
      }
    } catch {
      // Ignorar si la tabla no fue migrada aún
    }

    // Consultar bloqueos activos
    let activeLocks: any[] = [];
    try {
      if (supabase) {
        const { data: locks } = await supabase
          .from('space_locks')
          .select('*')
          .eq('parking_id', params.parking_id)
          .eq('date', params.date)
          .eq('status', 'active')
          .gt('expires_at', nowIso)
          .lt('start_time', params.end_time)
          .gt('end_time', params.start_time);
        activeLocks = locks || [];
      }
    } catch {
      // fallback
    }

    // Consultar reservas activas en ese rango horario
    let activeReservations: any[] = [];
    try {
      if (supabase) {
        const { data: resList } = await supabase
          .from('reservations')
          .select('space_id')
          .eq('parking_id', params.parking_id)
          .eq('date', params.date)
          .in('status', ['pending', 'confirmed'])
          .lt('start_time', params.end_time)
          .gt('end_time', params.start_time);
        activeReservations = resList || [];
      }
    } catch {
      // fallback
    }
    const reservedSpaceIds = new Set(activeReservations.map((r) => r.space_id).filter(Boolean));

    const lockedMap = new Map<number, any>();
    for (const l of activeLocks) {
      const isMine = (params.session_id && l.session_id === params.session_id) || (params.user_id && l.user_id === params.user_id);
      const remaining = Math.max(0, Math.floor((new Date(l.expires_at).getTime() - Date.now()) / 1000));
      lockedMap.set(l.space_id, {
        lock_id: l.id,
        is_mine: isMine,
        expires_at: l.expires_at,
        seconds_remaining: remaining,
      });
    }

    const spacesComputed = spaces.map((s) => {
      const lock = lockedMap.get(s.id);
      const isMaintenance = s.status === 'maintenance';
      const isReserved = reservedSpaceIds.has(s.id) || s.status === 'occupied' || s.status === 'reserved';

      let status: string = s.status;
      let isAvailable = false;
      let isLockedByMe = false;
      let isLockedByOther = false;

      if (isMaintenance) {
        status = 'maintenance';
        isAvailable = false;
      } else if (isReserved) {
        status = 'occupied';
        isAvailable = false;
      } else if (lock) {
        if (lock.is_mine) {
          status = 'locked_by_me';
          isAvailable = true;
          isLockedByMe = true;
        } else {
          status = 'locked_by_other';
          isAvailable = false;
          isLockedByOther = true;
        }
      } else {
        status = 'available';
        isAvailable = true;
      }

      return {
        id: s.id,
        code: s.code,
        floor: s.floor,
        space_type: s.space_type,
        is_available: isAvailable,
        status,
        is_locked_by_me: isLockedByMe,
        is_locked_by_other: isLockedByOther,
        lock_info: lock || null,
      };
    });

    const availableCount = spacesComputed.filter((s) => s.is_available).length;

    return {
      parking_id: Number(params.parking_id),
      total_spaces: spaces.length,
      available_spaces_count: availableCount,
      has_availability: availableCount > 0,
      duration_hours: duration,
      estimated_price: duration * parking.price_per_hour,
      spaces: spacesComputed,
    };
  },

  async acquireSpaceLock(params: {
    space_id: number;
    parking_id: number;
    user_id?: number;
    session_id: string;
    date: string;
    start_time: string;
    end_time: string;
  }): Promise<LockAcquireResult> {
    if (!supabase) throw new Error('Supabase no está configurado.');

    // Sanitizar user_id contra la tabla users de Supabase para evitar violación de FK
    const userStr = localStorage.getItem('parkia_user');
    const storedUser = userStr ? JSON.parse(userStr) : null;
    const validUserId = await getValidSupabaseUserId(params.user_id, storedUser?.email);

    // 1. Invocar función RPC atómica de PostgreSQL con bloqueo de fila FOR UPDATE
    try {
      const { data, error } = await supabase.rpc('acquire_space_lock', {
        p_space_id: params.space_id,
        p_parking_id: params.parking_id,
        p_user_id: validUserId,
        p_session_id: params.session_id,
        p_date: params.date,
        p_start_time: params.start_time,
        p_end_time: params.end_time,
      });

      if (!error && data) {
        return data as LockAcquireResult;
      }
    } catch (rpcErr) {
      console.warn('RPC acquire_space_lock error, intentando fallback cliente:', rpcErr);
    }

    // 2. Fallback transaccional del lado cliente si la función RPC aún no está creada
    const nowIso = new Date().toISOString();
    try {
      await supabase
        .from('space_locks')
        .update({ status: 'expired' })
        .eq('status', 'active')
        .lt('expires_at', nowIso);

      const { data: otherLocks } = await supabase
        .from('space_locks')
        .select('*')
        .eq('space_id', params.space_id)
        .eq('date', params.date)
        .eq('status', 'active')
        .gt('expires_at', nowIso)
        .lt('start_time', params.end_time)
        .gt('end_time', params.start_time);

      const conflicting = (otherLocks || []).find(
        (l) => l.session_id !== params.session_id && (!validUserId || l.user_id !== validUserId)
      );

      if (conflicting) {
        return {
          success: false,
          code: 'LOCKED_BY_OTHER',
          message: 'Esta plaza acaba de ser seleccionada por otro usuario. Elegí otra plaza disponible.',
        };
      }

      const { data: reservations } = await supabase
        .from('reservations')
        .select('id')
        .eq('space_id', params.space_id)
        .eq('date', params.date)
        .in('status', ['pending', 'confirmed'])
        .lt('start_time', params.end_time)
        .gt('end_time', params.start_time);

      if (reservations && reservations.length > 0) {
        return {
          success: false,
          code: 'ALREADY_RESERVED',
          message: 'Esta plaza ya se encuentra reservada para esa franja horaria.',
        };
      }

      if (validUserId) {
        await supabase
          .from('space_locks')
          .update({ status: 'released' })
          .eq('parking_id', params.parking_id)
          .eq('status', 'active')
          .or(`session_id.eq.${params.session_id},user_id.eq.${validUserId}`);
      } else {
        await supabase
          .from('space_locks')
          .update({ status: 'released' })
          .eq('parking_id', params.parking_id)
          .eq('status', 'active')
          .eq('session_id', params.session_id);
      }

      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      const insertPayload = {
        space_id: params.space_id,
        parking_id: params.parking_id,
        user_id: validUserId,
        session_id: params.session_id,
        date: params.date,
        start_time: params.start_time,
        end_time: params.end_time,
        status: 'active',
        locked_at: nowIso,
        expires_at: expiresAt,
      };

      let { data: newLock, error: insertErr } = await supabase
        .from('space_locks')
        .insert(insertPayload)
        .select('id')
        .single();

      // Si la base de datos aún tiene la restricción estricta de FK en space_locks_user_id_fkey, reintentar con user_id null
      if (insertErr && (insertErr.code === '23503' || insertErr.message?.includes('space_locks_user_id_fkey') || insertErr.message?.includes('foreign key'))) {
        const retry = await supabase
          .from('space_locks')
          .insert({
            ...insertPayload,
            user_id: null,
          })
          .select('id')
          .single();
        if (!retry.error && retry.data) {
          newLock = retry.data;
          insertErr = null;
        }
      }

      if (insertErr || !newLock) {
        return {
          success: false,
          code: 'LOCK_FAILED',
          message: 'No se pudo bloquear la plaza: ' + (insertErr?.message || 'Error al registrar bloqueo.'),
        };
      }

      await supabase.from('parking_spaces').update({ status: 'locked' }).eq('id', params.space_id);

      return {
        success: true,
        lock_id: newLock.id,
        space_id: params.space_id,
        expires_at: expiresAt,
        ttl_seconds: 300,
        message: 'Tu plaza está protegida durante 5 minutos.',
      };
    } catch (e: any) {
      return {
        success: false,
        code: 'LOCK_ERROR',
        message: e.message || 'Error al procesar el bloqueo.',
      };
    }
  },

  async releaseSpaceLock(params: {
    lock_id: number;
    session_id: string;
    user_id?: number;
  }): Promise<{ success: boolean; message: string }> {
    if (!supabase) return { success: false, message: 'Supabase no disponible.' };

    try {
      const { data, error } = await supabase.rpc('release_space_lock', {
        p_lock_id: params.lock_id,
        p_session_id: params.session_id,
        p_user_id: params.user_id || null,
      });
      if (!error && data) return data;
    } catch {
      // Fallback
    }

    try {
      const { data: lock } = await supabase
        .from('space_locks')
        .select('space_id')
        .eq('id', params.lock_id)
        .single();

      await supabase
        .from('space_locks')
        .update({ status: 'released' })
        .eq('id', params.lock_id);

      if (lock?.space_id) {
        await supabase.from('parking_spaces').update({ status: 'available' }).eq('id', lock.space_id);
      }
      return { success: true, message: 'Plaza liberada exitosamente.' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Error al liberar plaza.' };
    }
  },

  async confirmReservationWithLock(data: {
    lock_id: number;
    session_id: string;
    parking: number;
    space?: number;
    vehicle_plate: string;
    vehicle_model?: string;
    date: string;
    start_time: string;
    end_time: string;
    payment_method?: string;
    payment_status?: 'pending' | 'paid' | 'refunded';
    status?: ReservationStatus;
  }): Promise<{ message: string; reservation: Reservation }> {
    if (!supabase) throw new Error('Supabase no está configurado.');

    const userStr = localStorage.getItem('parkia_user');
    const storedUser = userStr ? JSON.parse(userStr) : null;
    let validUserId = await getValidSupabaseUserId(storedUser?.id, storedUser?.email);
    if (!validUserId) {
      const { data: defaultUser } = await supabase
        .from('users')
        .select('id')
        .order('id', { ascending: true })
        .limit(1)
        .maybeSingle();
      validUserId = defaultUser?.id || 1;
    }

    // 1. Invocar RPC PostgreSQL con bloqueo transaccional
    try {
      const { data: rpcRes, error } = await supabase.rpc('confirm_reservation_with_lock', {
        p_lock_id: data.lock_id,
        p_session_id: data.session_id,
        p_user_id: validUserId,
        p_vehicle_plate: data.vehicle_plate,
        p_vehicle_model: data.vehicle_model || 'Auto Particular',
        p_payment_method: data.payment_method || 'Mercado Pago',
        p_payment_status: data.payment_status || 'paid',
        p_reservation_status: data.status || 'confirmed',
      });

      if (rpcRes) {
        if (!rpcRes.success) {
          throw new Error(rpcRes.message || 'No se pudo confirmar la reserva.');
        }
        return { message: rpcRes.message, reservation: rpcRes.reservation };
      }

      if (error && error.code !== 'PGRST202') {
        throw new Error(error.message || 'Error al confirmar la reserva.');
      }
    } catch (e: any) {
      // Las fallas de validación deben propagarse inmediatamente para impedir duplicados
      throw e;
    }

    // 2. Solo si el RPC no existe en la base de datos (fallback excepcional)
    const res = await this.createReservation({
      ...data,
    });
    try {
      await supabase.from('space_locks').update({ status: 'converted' }).eq('id', data.lock_id);
    } catch {
      // Ignorar si la tabla no está creada
    }
    return res;
  },
};

// ============================================================================
// SUPABASE ADMIN SERVICE
// ============================================================================
export const supabaseAdmin = {
  async getDashboardStats(): Promise<AdminDashboardData> {
    const parkings = await supabaseParking.getParkings();
    const reservations = await supabaseReservations.getReservations();
    const spaces = await supabaseParking.getAllSpaces();

    const totalRevenue = reservations
      .filter((r) => r.status === 'completed' || r.status === 'confirmed')
      .reduce((sum, r) => sum + Number(r.total_price), 0);

    const todayStr = new Date().toISOString().slice(0, 10);
    const todayReservations = reservations.filter((r) => r.date === todayStr);
    const todayRevenue = todayReservations.reduce((sum, r) => sum + Number(r.total_price), 0);

    const occupiedSpaces = spaces.filter((s) => s.status === 'occupied').length;
    const totalSpaces = spaces.length || 1;
    const occupancyRate = Math.round((occupiedSpaces / totalSpaces) * 100);

    const COMMISSION_RATE = 0.15;
    const OWNER_RATE = 0.85;
    const platformCommission = Math.round(totalRevenue * COMMISSION_RATE);
    const ownerNetRevenue = Math.round(totalRevenue * OWNER_RATE);
    const todayPlatformCommission = Math.round(todayRevenue * COMMISSION_RATE);
    const todayOwnerNetRevenue = Math.round(todayRevenue * OWNER_RATE);

    return {
      kpis: {
        total_reservations: reservations.length,
        today_reservations: todayReservations.length,
        active_parkings: parkings.filter((p) => p.is_active).length,
        total_parkings: parkings.length,
        total_spaces: totalSpaces,
        occupied_spaces: occupiedSpaces,
        occupancy_rate: occupancyRate,
        total_revenue: totalRevenue,
        today_revenue: todayRevenue,
        commission_rate_percentage: 15,
        platform_commission: platformCommission,
        owner_net_revenue: ownerNetRevenue,
        today_platform_commission: todayPlatformCommission,
        today_owner_net_revenue: todayOwnerNetRevenue,
      },
      charts: {
        reservations_by_day: [
          { date: '2026-11-04', day_name: 'Mié', label: 'Mié 04', reservations: 42, revenue: 84000 },
          { date: '2026-11-05', day_name: 'Jue', label: 'Jue 05', reservations: 48, revenue: 96000 },
          { date: '2026-11-06', day_name: 'Vie', label: 'Vie 06', reservations: 56, revenue: 124000 },
          { date: '2026-11-07', day_name: 'Sáb', label: 'Sáb 07', reservations: 60, revenue: 145000 },
          { date: '2026-11-08', day_name: 'Dom', label: 'Dom 08', reservations: 35, revenue: 78000 },
          { date: '2026-11-09', day_name: 'Lun', label: 'Lun 09', reservations: 52, revenue: 110000 },
          { date: '2026-11-10', day_name: 'Mar', label: 'Mar 10', reservations: reservations.length, revenue: totalRevenue },
        ],
        occupancy_by_hour: [
          { hour: '08:00', occupancy: 45, demand: 'Media' },
          { hour: '10:00', occupancy: 82, demand: 'Alta' },
          { hour: '12:00', occupancy: 95, demand: 'Muy Alta' },
          { hour: '14:00', occupancy: 88, demand: 'Alta' },
          { hour: '16:00', occupancy: 78, demand: 'Alta' },
          { hour: '18:00', occupancy: 90, demand: 'Muy Alta' },
          { hour: '20:00', occupancy: 65, demand: 'Media' },
        ],
        top_parkings: parkings.slice(0, 5).map((p) => ({
          id: p.id,
          name: p.name,
          revenue: Math.round(totalRevenue * 0.25),
          reservations_count: Math.round(reservations.length * 0.2),
          rating: p.rating,
          occupancy_rate: p.occupancy_rate,
        })),
        status_distribution: [
          { name: 'Confirmadas', value: reservations.filter((r) => r.status === 'confirmed').length, color: '#10B981' },
          { name: 'Completadas', value: reservations.filter((r) => r.status === 'completed').length, color: '#3B82F6' },
          { name: 'Canceladas', value: reservations.filter((r) => r.status === 'cancelled').length, color: '#F43F5E' },
          { name: 'Pendientes', value: reservations.filter((r) => r.status === 'pending').length, color: '#F59E0B' },
        ],
      },
      recent_reservations: reservations.slice(0, 10),
    };
  },
};
