from django.conf import settings
from django.core.mail import send_mail


def send_otp_email(email, code, expires_in_minutes):
    subject = "Verify your Assessly account"
    message = (
        f"Your verification code is {code}.\n"
        f"It expires in {expires_in_minutes} minutes."
    )
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email])
