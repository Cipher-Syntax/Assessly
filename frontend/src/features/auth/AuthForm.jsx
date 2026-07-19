import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { Eye, EyeOff, ScanText, FileText } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../../constants/config';
import { googleLogin, login, register, resendOtp, verifyOtp } from './services/authService';
import Spinner from '../../components/ui/Spinner';
import { useToast } from '../../app/useToast';
import { useTheme } from '../../app/ThemeProvider';

const emailPattern = /\S+@\S+\.\S+/;
const PENDING_OTP_EMAIL_KEY = 'assessly_pending_otp_email';

const getErrorMessage = (error, fallback) => {
    const data = error?.response?.data;

    if (!data) {
        return error?.message || fallback;
    }

    if (typeof data === 'string') {
        return data;
    }

    if (data.detail) {
        return data.detail;
    }

    if (data.code) {
        return data.code.replace(/_/g, ' ');
    }

    if (Array.isArray(data.non_field_errors) && data.non_field_errors[0]) {
        return data.non_field_errors[0];
    }

    const firstKey = Object.keys(data).find((key) => {
        const value = data[key];
        return (Array.isArray(value) && value[0]) || typeof value === 'string';
    });

    if (firstKey) {
        const value = data[firstKey];
        return Array.isArray(value) ? value[0] : value;
    }

    return fallback;
};

const AuthLeftPanel = () => {
    return (
        <div className="relative hidden lg:flex h-full w-full flex-col items-center justify-center bg-tertiary bg-grid border-r border-default px-12 py-16 text-center">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-tertiary/80 pointer-events-none" />
            <div className="relative z-10 flex flex-col items-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="flex h-32 w-32 items-center justify-center rounded-3xl bg-primary-500 text-on-primary shadow-xl shadow-primary-500/20 ring-4 ring-primary-500/10 transition-transform hover:scale-105 duration-300">
                        <FileText className="w-16 h-16" />
                    </div>
                    <div className="mt-6">
                        <h1 className="text-5xl font-bold tracking-tight text-primary">Assessly Forms</h1>
                        <p className="mt-6 text-lg text-secondary max-w-md leading-relaxed">
                            Create, share, and analyze beautiful forms and surveys with ease.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AuthRightPanel = ({ title, subtitle, children, footer }) => {
    return (
        <div className="flex h-full w-full flex-col justify-center px-6 py-10 sm:px-16 lg:px-24 bg-primary relative">
            <div className="mb-10 lg:hidden flex justify-center w-full">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500 text-on-primary shadow-md">
                        <FileText className="w-7 h-7" />
                    </div>
                    <span className="text-3xl font-bold tracking-tight text-primary">Assessly</span>
                </div>
            </div>
            <div className="mb-8 w-full max-w-md mx-auto">
                <h2 className="text-4xl font-bold tracking-tight text-primary">{title}</h2>
                <p className="mt-3 text-lg text-secondary">{subtitle}</p>
            </div>
            <div className="w-full max-w-md mx-auto">
                {children}
            </div>
            {footer}
        </div>
    );
};

const AuthForm = ({ mode = 'login' }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const [loginForm, setLoginForm] = useState({ email: '', password: '' });
    const [registerForm, setRegisterForm] = useState({ email: '', password: '', confirmPassword: '' });
    const [otpDigits, setOtpDigits] = useState(Array(6).fill(''));
    const [pendingEmail, setPendingEmail] = useState('');
    const [step, setStep] = useState('register');
    const [fieldErrors, setFieldErrors] = useState({});
    const [formError, setFormError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [resending, setResending] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [needsGoogleConsent, setNeedsGoogleConsent] = useState(false);
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [showRegisterPassword, setShowRegisterPassword] = useState(false);
    const [showRegisterConfirm, setShowRegisterConfirm] = useState(false);
    const otpInputsRef = useRef([]);
    const toast = useToast();
    const { reloadTheme } = useTheme();

    const isRegisterMode = mode === 'register';
    const isOtpStep = isRegisterMode && step === 'otp';

    const inputClassName =
        'mt-2 w-full rounded-lg border border-default bg-tertiary px-3 py-2 text-sm text-primary placeholder:text-muted focus:border-focus focus:outline-none';
    const primaryButtonClass =
        'w-full rounded-lg bg-primary-500 cursor-pointer px-4 py-2 text-sm font-semibold text-on-primary transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60';
    const secondaryButtonClass =
        'w-full rounded-lg border border-default cursor-pointer bg-tertiary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-60';
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
    const googleRedirectUri = `${window.location.origin}${location.pathname}`;

    const headingText = useMemo(() => {
        if (isOtpStep) {
            return 'Verify your email';
        }
        return isRegisterMode ? 'Create your account' : 'Welcome back';
    }, [isOtpStep, isRegisterMode]);

    const subtitleText = useMemo(() => {
        if (isOtpStep) {
            return `Enter the 6-digit code sent to ${pendingEmail || registerForm.email || 'your email'}.`;
        }
        return isRegisterMode
            ? 'Create your account to publish and manage structured forms.'
            : 'Sign in to continue to your dashboard.';
    }, [isOtpStep, isRegisterMode, pendingEmail, registerForm.email]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const access = params.get('access');
        const refresh = params.get('refresh');

        if (access && refresh) {
            localStorage.setItem(ACCESS_TOKEN, access);
            localStorage.setItem(REFRESH_TOKEN, refresh);
            window.history.replaceState({}, document.title, window.location.pathname);
            navigate('/dashboard', { replace: true });
        }
    }, [navigate]);

    useEffect(() => {
        if (isRegisterMode) {
            const storedEmail = localStorage.getItem(PENDING_OTP_EMAIL_KEY);
            if (storedEmail) {
                setPendingEmail(storedEmail);
                setRegisterForm((prev) => ({ ...prev, email: storedEmail }));
                setStep('otp');
                setOtpDigits(Array(6).fill(''));
            } else {
                setPendingEmail('');
                setStep('register');
            }
        } else {
            setStep('login');
        }
        setFieldErrors({});
        setFormError('');
        setResendCooldown(0);
    }, [isRegisterMode]);

    useEffect(() => {
        if (mode === 'login') {
            const prefillEmail = location.state?.prefillEmail;
            const verified = location.state?.verified;

            if (prefillEmail) {
                setLoginForm((prev) => ({ ...prev, email: prefillEmail }));
            }

            setSuccessMessage(verified ? 'Email verified. Please sign in.' : '');
        } else {
            setSuccessMessage('');
        }
    }, [location.key, location.state, mode]);

    useEffect(() => {
        if (resendCooldown <= 0) {
            return undefined;
        }

        const timer = window.setInterval(() => {
            setResendCooldown((prev) => (prev > 1 ? prev - 1 : 0));
        }, 1000);

        return () => window.clearInterval(timer);
    }, [resendCooldown]);

    const handleGoogleTokenLogin = useCallback(
        async (accessToken) => {
            if (!accessToken) {
                const message = 'Google sign in failed.';
                setFormError(message);
                toast.error(message);
                return;
            }

            setGoogleLoading(true);
            setFormError('');
            try {
                const data = await googleLogin({ accessToken });
                setNeedsGoogleConsent(false);
                localStorage.setItem(ACCESS_TOKEN, data.access);
                localStorage.setItem(REFRESH_TOKEN, data.refresh);
                localStorage.removeItem(PENDING_OTP_EMAIL_KEY);
                await reloadTheme();
                navigate('/dashboard');
            } catch (error) {
                const rawCode = error?.response?.data?.code;
                const errorCode = Array.isArray(rawCode) ? rawCode[0] : rawCode;

                if (errorCode === 'google_signup_required') {
                    const message =
                        'Google needs email access. Please continue with Google again and allow email permission.';
                    setNeedsGoogleConsent(true);
                    setFormError(message);
                    toast.error(message);
                    return;
                }

                const message = getErrorMessage(error, 'Google sign in failed.');
                setFormError(message);
                toast.error(message);
            } finally {
                setGoogleLoading(false);
            }
        },
        [navigate, toast]
    );

    useEffect(() => {
        const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
        const searchParams = new URLSearchParams(window.location.search);
        const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
        const error = hashParams.get('error') || searchParams.get('error');
        const errorDescription =
            hashParams.get('error_description') || searchParams.get('error_description');

        if (!accessToken && !error) {
            return;
        }

        const cleanedUrl = `${window.location.pathname}${window.location.search}`;
        window.history.replaceState({}, document.title, cleanedUrl);

        if (error) {
            const message = errorDescription || 'Google sign in failed.';
            setFormError(message);
            toast.error(message);
            return;
        }

        handleGoogleTokenLogin(accessToken);
    }, [handleGoogleTokenLogin, toast]);

    const updateField = (setter, field) => (event) => {
        const value = event.target.value;
        setter((prev) => ({ ...prev, [field]: value }));
        if (fieldErrors[field]) {
            setFieldErrors((prev) => ({ ...prev, [field]: '' }));
        }
        if (formError) {
            setFormError('');
        }
    };

    const validateLogin = () => {
        const errors = {};

        if (!loginForm.email.trim()) {
            errors.email = 'Email is required.';
        } else if (!emailPattern.test(loginForm.email.trim())) {
            errors.email = 'Enter a valid email.';
        }

        if (!loginForm.password) {
            errors.password = 'Password is required.';
        }

        return errors;
    };

    const validateRegister = () => {
        const errors = {};

        if (!registerForm.email.trim()) {
            errors.email = 'Email is required.';
        } else if (!emailPattern.test(registerForm.email.trim())) {
            errors.email = 'Enter a valid email.';
        }

        if (!registerForm.password) {
            errors.password = 'Password is required.';
        }

        if (!registerForm.confirmPassword) {
            errors.confirmPassword = 'Confirm your password.';
        } else if (registerForm.password && registerForm.password !== registerForm.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match.';
        }

        return errors;
    };

    const validateOtp = () => {
        const errors = {};
        const code = otpDigits.join('');

        if (code.length !== 6) {
            errors.code = 'Enter the 6-digit code.';
        }

        return errors;
    };

    const handleLoginSubmit = async (event) => {
        event.preventDefault();
        setFormError('');

        const errors = validateLogin();
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setLoading(true);
        try {
            const payload = {
                email: loginForm.email.trim(),
                password: loginForm.password,
            };
            const data = await login(payload);
            localStorage.setItem(ACCESS_TOKEN, data.access);
            localStorage.setItem(REFRESH_TOKEN, data.refresh);
            localStorage.removeItem(PENDING_OTP_EMAIL_KEY);
            await reloadTheme();
            navigate('/dashboard');
        } catch (error) {
            const rawCode = error?.response?.data?.code;
            const errorCode = Array.isArray(rawCode) ? rawCode[0] : rawCode;
            if (errorCode === 'email_not_verified') {
                const pending = loginForm.email.trim();
                if (pending) {
                    localStorage.setItem(PENDING_OTP_EMAIL_KEY, pending);
                    navigate('/register');
                    return;
                }
            }
            const message = getErrorMessage(error, 'Unable to sign in.');
            setFormError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterSubmit = async (event) => {
        event.preventDefault();
        setFormError('');

        const errors = validateRegister();
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setLoading(true);
        try {
            const email = registerForm.email.trim();
            const payload = {
                email,
                password: registerForm.password,
                confirm_password: registerForm.confirmPassword,
            };
            await register(payload);
            localStorage.setItem(PENDING_OTP_EMAIL_KEY, email);
            setPendingEmail(email);
            setStep('otp');
            setOtpDigits(Array(6).fill(''));
            setResendCooldown(20);
        } catch (error) {
            const message = getErrorMessage(error, 'Unable to create account.');
            setFormError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleOtpSubmit = async (event) => {
        event.preventDefault();
        setFormError('');

        const errors = validateOtp();
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setLoading(true);
        try {
            const email = pendingEmail || registerForm.email.trim();
            const code = otpDigits.join('');
            await verifyOtp({ email, code });
            localStorage.removeItem(PENDING_OTP_EMAIL_KEY);
            navigate('/login', { state: { prefillEmail: email, verified: true } });
        } catch (error) {
            const message = getErrorMessage(error, 'Unable to verify code.');
            setFormError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (index) => (event) => {
        const rawValue = event.target.value;
        const digits = rawValue.replace(/\D/g, '');
        const nextValue = digits.slice(-1);

        setOtpDigits((prev) => {
            const updated = [...prev];
            updated[index] = nextValue;
            return updated;
        });

        if (fieldErrors.code) {
            setFieldErrors((prev) => ({ ...prev, code: '' }));
        }

        if (formError) {
            setFormError('');
        }

        if (nextValue && index < otpInputsRef.current.length - 1) {
            otpInputsRef.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index) => (event) => {
        if (event.key !== 'Backspace') {
            return;
        }

        if (otpDigits[index]) {
            return;
        }

        if (index > 0) {
            otpInputsRef.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (event) => {
        const pasteValue = event.clipboardData.getData('text');
        const digits = pasteValue.replace(/\D/g, '').slice(0, 6);

        if (!digits.length) {
            return;
        }

        event.preventDefault();
        const nextDigits = Array(6)
            .fill('')
            .map((_, index) => digits[index] || '');
        setOtpDigits(nextDigits);

        const nextIndex = Math.min(digits.length, 5);
        otpInputsRef.current[nextIndex]?.focus();
    };

    const handleOtpReset = () => {
        localStorage.removeItem(PENDING_OTP_EMAIL_KEY);
        setPendingEmail('');
        setOtpDigits(Array(6).fill(''));
        setFieldErrors({});
        setFormError('');
        setStep('register');
    };

    const handleResendOtp = async () => {
        if (resendCooldown > 0 || resending) {
            return;
        }

        setResending(true);
        setFormError('');
        try {
            const email = pendingEmail || registerForm.email.trim();
            await resendOtp({ email });
            setResendCooldown(20);
        } catch (error) {
            const message = getErrorMessage(error, 'Unable to resend code.');
            setFormError(message);
            toast.error(message);
        } finally {
            setResending(false);
        }
    };

    const startGoogleRedirectLogin = useGoogleLogin({
        onSuccess: (tokenResponse) => {
            handleGoogleTokenLogin(tokenResponse.access_token);
        },
        onError: () => {
            const message = 'Google sign in failed.';
            setFormError(message);
            toast.error(message);
        },
        scope: 'openid email profile',
        ux_mode: 'redirect',
        redirect_uri: googleRedirectUri,
    });

    const startGoogleConsentRedirectLogin = useGoogleLogin({
        onSuccess: (tokenResponse) => {
            handleGoogleTokenLogin(tokenResponse.access_token);
        },
        onError: () => {
            const message = 'Google sign in failed.';
            setFormError(message);
            toast.error(message);
        },
        scope: 'openid email profile',
        ux_mode: 'redirect',
        prompt: 'consent',
        redirect_uri: googleRedirectUri,
    });

    const startGoogleLogin = useGoogleLogin({
        onSuccess: (tokenResponse) => {
            handleGoogleTokenLogin(tokenResponse.access_token);
        },
        onError: () => {
            const message = 'Google sign in failed.';
            setFormError(message);
            toast.error(message);
        },
        onNonOAuthError: (nonOAuthError) => {
            if (nonOAuthError?.type === 'popup_failed_to_open') {
                startGoogleRedirectLogin();
                return;
            }

            if (nonOAuthError?.type === 'popup_closed') {
                return;
            }

            const message = 'Google sign in failed.';
            setFormError(message);
            toast.error(message);
        },
        scope: 'openid email profile',
    });

    const startGoogleConsentLogin = useGoogleLogin({
        onSuccess: (tokenResponse) => {
            handleGoogleTokenLogin(tokenResponse.access_token);
        },
        onError: () => {
            const message = 'Google sign in failed.';
            setFormError(message);
            toast.error(message);
        },
        onNonOAuthError: (nonOAuthError) => {
            if (nonOAuthError?.type === 'popup_failed_to_open') {
                startGoogleConsentRedirectLogin();
                return;
            }

            if (nonOAuthError?.type === 'popup_closed') {
                return;
            }

            const message = 'Google sign in failed.';
            setFormError(message);
            toast.error(message);
        },
        scope: 'openid email profile',
        prompt: 'consent',
    });

    const handleGoogleSignIn = () => {
        if (!googleClientId) {
            const message = 'Missing Google client ID. Set VITE_GOOGLE_CLIENT_ID in frontend/.env.';
            setFormError(message);
            toast.error(message);
            return;
        }
        if (needsGoogleConsent) {
            startGoogleConsentLogin();
            return;
        }

        startGoogleLogin();
    };

    const renderDivider = () => (
        <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-muted">
            <div className="h-px flex-1 border-t border-default" />
            <span>Or continue with Google</span>
            <div className="h-px flex-1 border-t border-default" />
        </div>
    );

    const renderGoogleButton = () => (
        <button
            type="button"
            className={secondaryButtonClass}
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
        >
            {googleLoading ? (
                <span className="inline-flex items-center gap-2">
                    <Spinner size="sm" />
                    Connecting...
                </span>
            ) : (
                'Continue with Google'
            )}
        </button>
    );

    const renderErrorBanner = () => {
        if (!formError) {
            return null;
        }

        return (
            <div className="rounded-lg border border-default bg-tertiary px-3 py-2 text-sm text-primary" aria-live="polite">
                {formError}
            </div>
        );
    };

    const renderSuccessBanner = () => {
        if (!successMessage) {
            return null;
        }

        return (
            <div className="rounded-lg border border-default bg-primary-soft px-3 py-2 text-sm text-primary" aria-live="polite">
                {successMessage}
            </div>
        );
    };

    const renderLoginForm = () => (
        <form className="space-y-5" onSubmit={handleLoginSubmit}>
            {renderSuccessBanner()}
            {renderErrorBanner()}
            <div>
                <label htmlFor="login-email" className="text-sm font-medium text-secondary">
                    Email address
                </label>
                <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    className={inputClassName}
                    placeholder='youremail@gmail.com'
                    value={loginForm.email}
                    onChange={updateField(setLoginForm, 'email')}
                    aria-invalid={Boolean(fieldErrors.email)}
                />
                {fieldErrors.email ? (
                    <p className="mt-1 text-xs text-primary-500">{fieldErrors.email}</p>
                ) : null}
            </div>
            <div>
                <label htmlFor="login-password" className="text-sm font-medium text-secondary">
                    Password
                </label>
                <div className="relative">
                    <input
                        id="login-password"
                        type={showLoginPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        className={`${inputClassName} pr-10`}
                        placeholder="********"
                        value={loginForm.password}
                        onChange={updateField(setLoginForm, 'password')}
                        aria-invalid={Boolean(fieldErrors.password)}
                    />
                    <button
                        type="button"
                        onClick={() => setShowLoginPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition hover:text-primary"
                        aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                    >
                        {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
                {fieldErrors.password ? (
                    <p className="mt-1 text-xs text-primary-500">{fieldErrors.password}</p>
                ) : null}
            </div>
            <div className="space-y-4">
                {renderDivider()}
                {renderGoogleButton()}
            </div>
            <button type="submit" className={primaryButtonClass} disabled={loading}>
                {loading ? (
                    <span className="inline-flex items-center gap-2">
                        <Spinner size="sm" />
                        Signing in...
                    </span>
                ) : (
                    'Sign in'
                )}
            </button>
            <p className="text-sm text-secondary">
                Need an account?{' '}
                <Link className="text-primary-500 hover:underline" to="/register">
                    Create one
                </Link>
            </p>
        </form>
    );

    const renderRegisterForm = () => (
        <form className="space-y-5" onSubmit={handleRegisterSubmit}>
            {renderErrorBanner()}
            <div>
                <label htmlFor="register-email" className="text-sm font-medium text-secondary">
                    Email address
                </label>
                <input
                    id="register-email"
                    type="email"
                    autoComplete="email"
                    className={inputClassName}
                    placeholder='youremail@gmail.com'
                    value={registerForm.email}
                    onChange={updateField(setRegisterForm, 'email')}
                    aria-invalid={Boolean(fieldErrors.email)}
                />
                {fieldErrors.email ? (
                    <p className="mt-1 text-xs text-primary-500">{fieldErrors.email}</p>
                ) : null}
            </div>
            <div>
                <label htmlFor="register-password" className="text-sm font-medium text-secondary">
                    Password
                </label>
                <div className="relative">
                    <input
                        id="register-password"
                        type={showRegisterPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        className={`${inputClassName} pr-10`}
                        placeholder="********"
                        value={registerForm.password}
                        onChange={updateField(setRegisterForm, 'password')}
                        aria-invalid={Boolean(fieldErrors.password)}
                    />
                    <button
                        type="button"
                        onClick={() => setShowRegisterPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition hover:text-primary"
                        aria-label={showRegisterPassword ? 'Hide password' : 'Show password'}
                    >
                        {showRegisterPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
                {fieldErrors.password ? (
                    <p className="mt-1 text-xs text-primary-500">{fieldErrors.password}</p>
                ) : null}
            </div>
            <div>
                <label htmlFor="register-confirm" className="text-sm font-medium text-secondary">
                    Confirm password
                </label>
                <div className="relative">
                    <input
                        id="register-confirm"
                        type={showRegisterConfirm ? 'text' : 'password'}
                        autoComplete="new-password"
                        className={`${inputClassName} pr-10`}
                        placeholder="********"
                        value={registerForm.confirmPassword}
                        onChange={updateField(setRegisterForm, 'confirmPassword')}
                        aria-invalid={Boolean(fieldErrors.confirmPassword)}
                    />
                    <button
                        type="button"
                        onClick={() => setShowRegisterConfirm((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition hover:text-primary"
                        aria-label={showRegisterConfirm ? 'Hide password confirmation' : 'Show password confirmation'}
                    >
                        {showRegisterConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
                {fieldErrors.confirmPassword ? (
                    <p className="mt-1 text-xs text-primary-500">{fieldErrors.confirmPassword}</p>
                ) : null}
            </div>
            <div className="space-y-4">
                {renderDivider()}
                {renderGoogleButton()}
            </div>
            <button type="submit" className={primaryButtonClass} disabled={loading}>
                {loading ? (
                    <span className="inline-flex items-center gap-2">
                        <Spinner size="sm" />
                        Creating account...
                    </span>
                ) : (
                    'Create account'
                )}
            </button>
            <p className="text-sm text-secondary">
                Already have an account?{' '}
                <Link className="text-primary-500 hover:underline" to="/login">
                    Sign in
                </Link>
            </p>
        </form>
    );

    const renderOtpForm = () => (
        <form className="space-y-5" onSubmit={handleOtpSubmit}>
            {renderErrorBanner()}
            <div className='mt-10'>
                <label htmlFor="otp-code" className="text-sm font-medium text-secondary">
                    Verification code
                </label>
                <div className="mt-2 grid grid-cols-6 gap-2">
                    {otpDigits.map((digit, index) => (
                        <input
                            key={`otp-${index}`}
                            id={index === 0 ? 'otp-code' : undefined}
                            type="text"
                            inputMode="numeric"
                            autoComplete={index === 0 ? 'one-time-code' : 'off'}
                            className="h-17 w-full gap-2 rounded-lg border border-default bg-tertiary text-center text-lg text-primary focus:border-focus focus:outline-none"
                            value={digit}
                            onChange={handleOtpChange(index)}
                            onKeyDown={handleOtpKeyDown(index)}
                            onPaste={index === 0 ? handleOtpPaste : undefined}
                            aria-invalid={Boolean(fieldErrors.code)}
                            aria-label={`OTP digit ${index + 1}`}
                            ref={(element) => {
                                otpInputsRef.current[index] = element;
                            }}
                        />
                    ))}
                </div>
                {fieldErrors.code ? (
                    <p className="mt-1 text-xs text-primary-500">{fieldErrors.code}</p>
                ) : null}
            </div>
            <button type="submit" className={primaryButtonClass} disabled={loading}>
                {loading ? (
                    <span className="inline-flex items-center gap-2">
                        <Spinner size="sm" />
                        Verifying...
                    </span>
                ) : (
                    'Verify email'
                )}
            </button>
            <div className="flex items-center justify-between text-sm text-secondary">
                <span>Did not get a code?</span>
                <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || resending}
                    className="text-primary-500 hover:underline disabled:cursor-not-allowed disabled:text-muted"
                >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : resending ? 'Resending...' : 'Resend code'}
                </button>
            </div>
            <button
                type="button"
                onClick={handleOtpReset}
                className="text-left text-sm text-secondary hover:text-primary"
            >
                Use a different email
            </button>
            <p className="text-sm text-secondary">
                Prefer to sign in instead?{' '}
                <Link className="text-primary-500 hover:underline" to="/login">
                    Back to sign in
                </Link>
            </p>
        </form>
    );

    return (
        <div className="flex min-h-screen w-full bg-primary fade-rise">
            <div className="grid w-full grid-cols-1 lg:grid-cols-2">
                <AuthLeftPanel />
                <AuthRightPanel title={headingText} subtitle={subtitleText}>
                    {isOtpStep ? renderOtpForm() : isRegisterMode ? renderRegisterForm() : renderLoginForm()}
                </AuthRightPanel>
            </div>
        </div>
    );
};

export default AuthForm;
