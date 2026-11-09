"""Verificación de los tokens de Auth0 (botón "Continuar con Google")."""
import json
import urllib.request

import jwt
from django.conf import settings


class Auth0Error(Exception):
    pass


_jwks_client = None


def _jwks():
    # Descarga (y guarda en memoria) las claves públicas de Auth0 para verificar la firma.
    global _jwks_client
    if _jwks_client is None:
        _jwks_client = jwt.PyJWKClient(f'https://{settings.AUTH0_DOMAIN}/.well-known/jwks.json')
    return _jwks_client


def verify_auth0_token(token):
    """Comprueba que el token lo emitió NUESTRO Auth0 para NUESTRA API y devuelve el perfil."""
    if not settings.AUTH0_DOMAIN or not settings.AUTH0_AUDIENCE:
        raise Auth0Error('El acceso con Google no está configurado.')

    try:
        key = _jwks().get_signing_key_from_jwt(token).key
        claims = jwt.decode(
            token,
            key,
            algorithms=['RS256'],
            audience=settings.AUTH0_AUDIENCE,
            issuer=f'https://{settings.AUTH0_DOMAIN}/',
        )
    except jwt.PyJWTError as exc:
        raise Auth0Error('El token de Auth0 no es válido.') from exc

    # El access token no trae el email: se lo pedimos a Auth0 con el mismo token.
    request = urllib.request.Request(
        f'https://{settings.AUTH0_DOMAIN}/userinfo',
        headers={'Authorization': f'Bearer {token}'},
    )
    try:
        with urllib.request.urlopen(request, timeout=5) as response:
            profile = json.load(response)
    except Exception as exc:  # noqa: BLE001
        raise Auth0Error('No se pudo obtener el perfil desde Auth0.') from exc

    if profile.get('sub') != claims.get('sub'):
        raise Auth0Error('El token de Auth0 no es válido.')
    return profile
