from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('El correo electrónico es obligatorio.')
        # Los roles no son una columna del usuario: se guardan en UserRole.
        # 'role' es el rol principal y 'roles' una lista de roles extra (ej. ['disabled']).
        main_role = extra_fields.pop('role', None)
        extra_roles = list(extra_fields.pop('roles', []) or [])

        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)

        user.add_role(main_role or User.Role.DRIVER)
        for code in extra_roles:
            user.add_role(code)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', User.Role.ADMIN)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser debe tener is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser debe tener is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class Role(models.Model):
    """
    Catálogo de roles. Un usuario puede tener varios roles y un rol lo pueden
    tener muchos usuarios: la relación se guarda en la tabla intermedia UserRole.
    """
    code = models.SlugField('Código', max_length=30, unique=True)  # driver, owner, admin, disabled
    name = models.CharField('Nombre', max_length=100)
    description = models.TextField('Descripción', blank=True)

    class Meta:
        verbose_name = 'Rol'
        verbose_name_plural = 'Roles'
        ordering = ['id']

    def __str__(self):
        return self.name


class User(AbstractUser):
    class Role(models.TextChoices):
        # Códigos de los roles (filas de la tabla Role)
        DRIVER = 'driver', 'Conductor'
        ADMIN = 'admin', 'Super Administrador (Plataforma)'
        OWNER = 'owner', 'Dueño de Estacionamiento (Operador)'
        DISABLED = 'disabled', 'Persona con discapacidad (credencial verificada)'

    # Roles "principales": definen qué puede hacer la persona en la app.
    # 'disabled' es un rol adicional: se suma a uno de estos.
    MAIN_ROLES = [Role.ADMIN, Role.OWNER, Role.DRIVER]

    username = None
    email = models.EmailField('Correo electrónico', unique=True)
    first_name = models.CharField('Nombre', max_length=150)
    last_name = models.CharField('Apellido', max_length=150)
    phone = models.CharField('Teléfono', max_length=30, blank=True, null=True)
    avatar_url = models.URLField('URL del Avatar', blank=True, null=True)
    roles = models.ManyToManyField(
        'users.Role',
        through='users.UserRole',
        related_name='users',
        blank=True,
        verbose_name='Roles',
    )
    cud_number = models.CharField('Número de CUD', max_length=50, blank=True, null=True)
    cud_verified = models.BooleanField('CUD Verificado', default=False)
    cud_expiration = models.DateField('Fecha de vencimiento del CUD', blank=True, null=True)
    created_at = models.DateTimeField('Fecha de registro', auto_now_add=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_full_name()} ({self.email})"

    # --- Roles (tabla intermedia UserRole) ---------------------------------

    @property
    def role_codes(self):
        """Códigos de todos los roles del usuario, por ejemplo ['driver', 'disabled']."""
        if not self.pk:
            return []
        if not hasattr(self, '_role_codes_cache'):
            self._role_codes_cache = list(self.roles.values_list('code', flat=True))
        return self._role_codes_cache

    def _clear_role_cache(self):
        if hasattr(self, '_role_codes_cache'):
            del self._role_codes_cache

    def has_role(self, code):
        return code in self.role_codes

    def add_role(self, code):
        role = Role.objects.get(code=code)
        UserRole.objects.get_or_create(user=self, role=role)
        self._clear_role_cache()

    def remove_role(self, code):
        UserRole.objects.filter(user=self, role__code=code).delete()
        self._clear_role_cache()

    def set_main_role(self, code):
        """Cambia el rol principal (conductor, dueño o admin) sin tocar los roles adicionales."""
        UserRole.objects.filter(user=self, role__code__in=self.MAIN_ROLES).exclude(role__code=code).delete()
        self.add_role(code)

    @property
    def role(self):
        """
        Rol principal, calculado desde UserRole (admin > dueño > conductor).
        Se mantiene para que el resto del código y el frontend sigan funcionando.
        """
        codes = self.role_codes
        for code in self.MAIN_ROLES:
            if code in codes:
                return code
        return self.Role.DRIVER

    @role.setter
    def role(self, value):
        self.set_main_role(value)

    def get_role_display(self):
        return self.Role(self.role).label

    @property
    def is_super_admin(self):
        return self.has_role(self.Role.ADMIN) or self.is_superuser

    @property
    def is_owner_role(self):
        return self.has_role(self.Role.OWNER)

    @property
    def is_admin_role(self):
        return self.has_role(self.Role.ADMIN) or self.has_role(self.Role.OWNER) or self.is_superuser


class UserRole(models.Model):
    """Tabla intermedia: cada fila dice 'este usuario tiene este rol'."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_roles')
    # PROTECT: no se puede borrar un rol mientras haya usuarios que lo tengan
    role = models.ForeignKey(Role, on_delete=models.PROTECT, related_name='user_roles')
    assigned_at = models.DateTimeField('Asignado el', auto_now_add=True)

    class Meta:
        verbose_name = 'Rol de usuario'
        verbose_name_plural = 'Roles de usuario'
        unique_together = ('user', 'role')

    def __str__(self):
        return f"{self.user.email} → {self.role.code}"
