import { useEffect, useState } from 'react';
import DashboardLayout from '../dashboard/components/DashboardLayout';
import { useUser } from '../auth/hooks/useUser';
import { fetchSettings, updateSettings } from './services/settingsService';
import api from '../../services/api';
import { useToast } from '../../app/useToast';
import { useTheme } from '../../app/ThemeProvider';
import { Save, User, Palette, Settings as SettingsIcon } from 'lucide-react';

const SettingsPage = () => {
    const user = useUser();
    const toast = useToast();
    const { reloadTheme } = useTheme();
    
    const [settings, setSettings] = useState({
        default_collect_email: false,
        theme_preference: 'system',
        default_form_color: '#673ab7'
    });
    const [profileEmail, setProfileEmail] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const loadSettings = async () => {
            if (!profileEmail) {
                try {
                    const response = await api.get('/api/accounts/me/');
                    setProfileEmail(response.data?.email || response.data?.data?.email);
                } catch (err) {
                    console.error('Failed to fetch profile', err);
                }
            }

            const { settings: data, error } = await fetchSettings();
            if (data) {
                setSettings(data);
            }
            if (error) {
                toast.error(error);
            }
            setIsLoading(false);
        };
        loadSettings();
    }, [toast]);

    const handleSave = async () => {
        setIsSaving(true);
        const { settings: updatedData, error } = await updateSettings(settings);
        if (updatedData) {
            setSettings(updatedData);
            toast.success('Settings saved successfully');
            reloadTheme();
        }
        if (error) {
            toast.error(error);
        }
        setIsSaving(false);
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center py-20">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="mx-auto max-w-4xl pt-8 pb-16">
                <h1 className="text-3xl font-semibold text-primary mb-8">Settings</h1>
                
                <div className="grid gap-8 md:grid-cols-3">
                    
                    {/* Account Settings */}
                    <div className="md:col-span-1">
                        <div className="flex items-center gap-2 text-primary font-medium mb-2">
                            <User className="w-5 h-5 text-primary-500" />
                            Account
                        </div>
                        <p className="text-sm text-secondary">
                            Manage your account information and preferences.
                        </p>
                    </div>
                    <div className="md:col-span-2 rounded-xl border border-default bg-secondary p-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-primary mb-1">Email Address</label>
                                <input 
                                    type="email" 
                                    value={user?.email || profileEmail || ''} 
                                    disabled 
                                    className="w-full rounded-lg border border-default bg-tertiary px-4 py-2 text-secondary opacity-70 cursor-not-allowed" 
                                />
                                <p className="mt-1 text-xs text-secondary">Your email address cannot be changed currently.</p>
                            </div>
                        </div>
                    </div>

                    <div className="col-span-full border-t border-default my-2"></div>

                    {/* System Configuration */}
                    <div className="md:col-span-1">
                        <div className="flex items-center gap-2 text-primary font-medium mb-2">
                            <SettingsIcon className="w-5 h-5 text-primary-500" />
                            Form Defaults
                        </div>
                        <p className="text-sm text-secondary">
                            System-wide configuration for how new forms behave.
                        </p>
                    </div>
                    <div className="md:col-span-2 rounded-xl border border-default bg-secondary p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-primary">Collect email addresses</h3>
                                <p className="text-sm text-secondary mt-1">Automatically require respondents to provide their email.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer" 
                                    checked={settings.default_collect_email}
                                    onChange={(e) => setSettings({...settings, default_collect_email: e.target.checked})}
                                />
                                <div className="w-11 h-6 bg-tertiary peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--primary-500)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary-500)]"></div>
                            </label>
                        </div>
                    </div>

                    <div className="col-span-full border-t border-default my-2"></div>

                    {/* Styling Defaults */}
                    <div className="md:col-span-1">
                        <div className="flex items-center gap-2 text-primary font-medium mb-2">
                            <Palette className="w-5 h-5 text-primary-500" />
                            Styling Defaults
                        </div>
                        <p className="text-sm text-secondary">
                            Set the default look and feel for your workspace.
                        </p>
                    </div>
                    <div className="md:col-span-2 rounded-xl border border-default bg-secondary p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-primary mb-3">Theme Preference</label>
                            <div className="flex gap-4">
                                {['light', 'dark', 'system'].map((theme) => (
                                    <label key={theme} className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="theme" 
                                            value={theme}
                                            checked={settings.theme_preference === theme}
                                            onChange={(e) => setSettings({...settings, theme_preference: e.target.value})}
                                            className="w-4 h-4 text-primary-500 cursor-pointer" 
                                        />
                                        <span className="text-sm text-primary capitalize">{theme}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-primary mb-3">Default Form Accent Color</label>
                            <div className="flex items-center gap-4">
                                <input 
                                    type="color" 
                                    value={settings.default_form_color}
                                    onChange={(e) => setSettings({...settings, default_form_color: e.target.value})}
                                    className="w-10 h-10 rounded border border-default cursor-pointer bg-transparent"
                                />
                                <span className="text-sm text-secondary uppercase font-mono">{settings.default_form_color}</span>
                            </div>
                        </div>
                    </div>

                </div>

                <div className="mt-8 flex justify-end">
                    <button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="flex items-center gap-2 rounded-lg bg-primary-500 px-6 py-2.5 text-sm font-semibold text-on-primary hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
                    >
                        {isSaving ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        Save Changes
                    </button>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default SettingsPage;
