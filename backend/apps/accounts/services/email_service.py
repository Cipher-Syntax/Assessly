from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string


def send_otp_email(email, code, expires_in_minutes):
    subject = "Verify your Assessly account"
    context = {
        "app_name": "Assessly",
        "code": code,
        "expires_in_minutes": expires_in_minutes,
        "subject": subject,
    }
    text_message = render_to_string("emails/otp.txt", context).strip()
    html_message = render_to_string("emails/otp.html", context)

    message = EmailMultiAlternatives(
        subject,
        text_message,
        settings.DEFAULT_FROM_EMAIL,
        [email],
    )
    message.attach_alternative(html_message, "text/html")
    message.send()
