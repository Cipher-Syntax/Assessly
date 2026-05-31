#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install dependencies
pip install -r requirements.txt

# Collect static files
python manage.py collectstatic --no-input

# Apply database migrations
python manage.py migrate

# Create superuser non-interactively
# Using '|| true' prevents the build from failing on subsequent deployments when the user already exists
if [[ -n "${DJANGO_SUPERUSER_EMAIL}" && -n "${DJANGO_SUPERUSER_PASSWORD}" ]]; then
    python manage.py createsuperuser \
        --noinput \
        --email "${DJANGO_SUPERUSER_EMAIL}" || true
fi
