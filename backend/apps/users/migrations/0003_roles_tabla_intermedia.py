"""
Pasa los roles de una columna en User a una relación muchos a muchos:
Role (catálogo) + UserRole (tabla intermedia).
1. Crea las tablas Role y UserRole.
2. Carga los roles: driver, owner, admin y disabled.
3. Copia el rol que tenía cada usuario a UserRole.
4. Borra la columna User.role.
"""
from django.db import migrations, models
import django.db.models.deletion

ROLES = [
    ('driver', 'Conductor', 'Busca y reserva plazas.'),
    ('owner', 'Dueño de estacionamiento', 'Gestiona su garaje, sus plazas y sus reservas.'),
    ('admin', 'Administrador', 'Gestiona toda la plataforma.'),
    ('disabled', 'Persona con discapacidad', 'Credencial verificada por un administrador. Puede reservar plazas accesibles.'),
]


def crear_roles_y_copiar(apps, schema_editor):
    Role = apps.get_model('users', 'Role')
    User = apps.get_model('users', 'User')
    UserRole = apps.get_model('users', 'UserRole')
    roles = {}
    for code, name, description in ROLES:
        roles[code], _ = Role.objects.get_or_create(code=code, defaults={'name': name, 'description': description})
    for user in User.objects.all():
        code = user.role if user.role in roles else 'driver'
        UserRole.objects.get_or_create(user=user, role=roles[code])


def volver_a_columna(apps, schema_editor):
    User = apps.get_model('users', 'User')
    UserRole = apps.get_model('users', 'UserRole')
    for user in User.objects.all():
        codes = set(UserRole.objects.filter(user=user).values_list('role__code', flat=True))
        user.role = next((c for c in ['admin', 'owner', 'driver'] if c in codes), 'driver')
        user.save(update_fields=['role'])


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_alter_user_role'),
    ]

    operations = [
        migrations.CreateModel(
            name='Role',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('code', models.SlugField(max_length=30, unique=True, verbose_name='Código')),
                ('name', models.CharField(max_length=100, verbose_name='Nombre')),
                ('description', models.TextField(blank=True, verbose_name='Descripción')),
            ],
            options={'verbose_name': 'Rol', 'verbose_name_plural': 'Roles', 'ordering': ['id']},
        ),
        migrations.CreateModel(
            name='UserRole',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('assigned_at', models.DateTimeField(auto_now_add=True, verbose_name='Asignado el')),
                ('role', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='user_roles', to='users.role')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='user_roles', to='users.user')),
            ],
            options={'verbose_name': 'Rol de usuario', 'verbose_name_plural': 'Roles de usuario', 'unique_together': {('user', 'role')}},
        ),
        migrations.AddField(
            model_name='user',
            name='roles',
            field=models.ManyToManyField(blank=True, related_name='users', through='users.UserRole', to='users.role', verbose_name='Roles'),
        ),
        migrations.RunPython(crear_roles_y_copiar, volver_a_columna),
        migrations.RemoveField(model_name='user', name='role'),
    ]
