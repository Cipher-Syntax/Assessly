from django.urls import path #type: ignore

from apps.accounts.views import (
    GoogleLoginView,
    LogoutView,
    RegisterView,
    ResendOtpView,
    VerifyOtpView,
    UserSettingsView,
    CurrentUserView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="accounts-register"),
    path("verify-otp/", VerifyOtpView.as_view(), name="accounts-verify-otp"),
    path("resend-otp/", ResendOtpView.as_view(), name="accounts-resend-otp"),
    path("logout/", LogoutView.as_view(), name="accounts-logout"),
    path("google/", GoogleLoginView.as_view(), name="accounts-google-login"),
    path("settings/", UserSettingsView.as_view(), name="accounts-settings"),
    path("me/", CurrentUserView.as_view(), name="accounts-me"),
]
