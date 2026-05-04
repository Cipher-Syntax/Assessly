from django.urls import path #type: ignore

from apps.accounts.views import (
    GoogleLoginView,
    LoginView,
    LogoutView,
    RegisterView,
    ResendOtpView,
    VerifyOtpView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="accounts-register"),
    path("verify-otp/", VerifyOtpView.as_view(), name="accounts-verify-otp"),
    path("resend-otp/", ResendOtpView.as_view(), name="accounts-resend-otp"),
    path("login/", LoginView.as_view(), name="accounts-login"),
    path("logout/", LogoutView.as_view(), name="accounts-logout"),
    path("google/", GoogleLoginView.as_view(), name="accounts-google-login"),
]
