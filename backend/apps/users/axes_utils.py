def axes_username(request, credentials):
    """Para django-axes: en Parkia el usuario es el email, siempre en minúsculas."""
    value = (credentials or {}).get('username')
    if not value:
        data = getattr(request, 'data', None) or getattr(request, 'POST', {})
        value = data.get('email', '')
    return str(value).strip().lower()
