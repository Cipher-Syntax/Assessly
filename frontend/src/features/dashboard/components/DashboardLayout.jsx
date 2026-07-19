import { Menu, Search, User, FileText, LogOut, Settings, LayoutTemplate, Home } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUser } from '../../auth/hooks/useUser';
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../../../constants/config';
import api from '../../../services/api';

const DashboardLayout = ({ children }) => {
    const user = useUser();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const initialQuery = searchParams.get('q') || '';
    
    // Local state for the input field to allow fast typing
    const [inputValue, setInputValue] = useState(initialQuery);
    
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    
    const menuRef = useRef(null);
    const profileRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const [profile, setProfile] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get('/api/accounts/me/');
                setProfile(response.data);
            } catch (err) {
                console.error('Failed to fetch profile', err);
            }
        };
        
        // Fetch profile if we don't have it yet, just in case user.email is missing or empty
        if (!profile && (!user || !user.email)) {
            fetchProfile();
        } else if (!profile && user?.email) {
            // If user has email but we don't have profile, we still fetch it to keep consistency
            fetchProfile();
        }
    }, [user, profile]);

    // Debounce the search input to update URL params
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (inputValue) {
                setSearchParams({ q: inputValue });
            } else {
                setSearchParams({});
            }
        }, 300); // 300ms delay

        return () => clearTimeout(timeoutId);
    }, [inputValue, setSearchParams]);

    const handleLogout = () => {
        localStorage.removeItem(ACCESS_TOKEN);
        localStorage.removeItem(REFRESH_TOKEN);
        navigate('/login');
    };

    const handleSearch = (e) => {
        setInputValue(e.target.value);
    };

    const userEmail = user?.email || profile?.email || profile?.data?.email;
    const displayEmail = userEmail || 'User';
    const userInitial = displayEmail !== 'User' ? displayEmail.charAt(0).toUpperCase() : 'U';

    return (
        <div className="min-h-screen bg-primary text-primary">
            <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-default bg-secondary px-4">
                <div className="flex items-center gap-4 w-1/4">
                    <div className="relative" ref={menuRef}>
                        <button 
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-2 text-secondary hover:text-primary transition-colors hover:bg-tertiary rounded-full"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        
                        {isMenuOpen && (
                            <div className="absolute left-0 top-12 w-64 rounded-xl border border-default bg-secondary py-2 shadow-lg z-50">
                                <button 
                                    onClick={() => navigate('/dashboard')}
                                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-primary hover:bg-tertiary transition-colors cursor-pointer"
                                >
                                    <Home className="w-5 h-5 text-secondary" />
                                    <span>Forms Dashboard</span>
                                </button>
                                <button className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-primary hover:bg-tertiary transition-colors cursor-pointer">
                                    <LayoutTemplate className="w-5 h-5 text-secondary" />
                                    <span>Templates</span>
                                </button>
                                <div className="my-1 border-t border-default"></div>
                                <button 
                                    onClick={() => navigate('/settings')}
                                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-primary hover:bg-tertiary transition-colors cursor-pointer"
                                >
                                    <Settings className="w-5 h-5 text-secondary" />
                                    <span>Settings</span>
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded bg-primary-500 text-on-primary">
                            <FileText className="w-6 h-6" />
                        </div>
                        <span className="text-xl font-medium tracking-tight text-secondary">Forms</span>
                    </div>
                </div>
                
                <div className="flex-1 max-w-3xl px-4 hidden md:block">
                    <div className="relative flex items-center w-full h-12 rounded-lg bg-tertiary px-4 focus-within:bg-secondary focus-within:shadow-sm focus-within:border focus-within:border-default border border-transparent transition-all">
                        <Search className="w-5 h-5 text-muted mr-3" />
                        <input 
                            type="text" 
                            placeholder="Search" 
                            value={inputValue}
                            onChange={handleSearch}
                            className="w-full bg-transparent outline-none text-primary placeholder:text-muted" 
                        />
                    </div>
                </div>

                <div className="flex items-center justify-end gap-4 w-1/4">
                    <div className="relative" ref={profileRef}>
                        <button 
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-500 border border-default text-on-primary font-bold hover:opacity-80 transition-opacity"
                        >
                            {userInitial}
                        </button>
                        
                        {isProfileOpen && (
                            <div className="absolute right-0 top-12 w-64 rounded-xl border border-default bg-secondary py-2 shadow-lg z-50">
                                <div className="px-4 py-3 border-b border-default mb-1">
                                    <p className="text-sm font-medium text-primary truncate">
                                        {displayEmail}
                                    </p>
                                </div>
                                <button 
                                    onClick={handleLogout}
                                    className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-danger hover:bg-tertiary transition-colors cursor-pointer"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>Log out</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>
            <main>{children}</main>
        </div>
    );
};

export default DashboardLayout;