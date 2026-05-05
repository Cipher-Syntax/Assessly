import hashlib
import secrets

from django.conf import settings
from django.utils import timezone #type: ignore

from apps.permissions.models import FormAccessToken


def generate_token():
    return secrets.token_urlsafe(32)


def hash_token(token):
    salted = f"{settings.SECRET_KEY}{token}".encode("utf-8")
    return hashlib.sha256(salted).hexdigest()


def create_token(form, scope, expires_at=None):
    plain_token = generate_token()
    token_hash = hash_token(plain_token)
    token = FormAccessToken.objects.create(
        form=form,
        scope=scope,
        token_hash=token_hash,
        expires_at=expires_at,
    )
    return token, plain_token


def validate_token(form, scope, token):
    if not token:
        return False
    token_hash = hash_token(token)
    access_token = FormAccessToken.objects.filter(
        form=form,
        scope=scope,
        token_hash=token_hash,
        is_active=True,
    ).first()
    if not access_token:
        return False
    if access_token.expires_at and access_token.expires_at <= timezone.now():
        return False
    access_token.last_used_at = timezone.now()
    access_token.save(update_fields=["last_used_at"])
    return True


def revoke_token(token_id):
    return FormAccessToken.objects.filter(id=token_id).update(is_active=False)


def rotate_token(token_id):
    token = FormAccessToken.objects.select_related("form").get(id=token_id)
    token.is_active = False
    token.save(update_fields=["is_active"])
    return create_token(token.form, token.scope, expires_at=token.expires_at)
