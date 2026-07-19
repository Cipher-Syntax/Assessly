import { createContext, useContext, useEffect, useState } from 'react';
import { fetchSettings } from '../features/settings/services/settingsService';
import { ACCESS_TOKEN } from '../constants/config';
export const ThemeContext = createContext({
    theme: 'system',
    accentColor: '#8B5CF6',
    setTheme: () => {},
    setAccentColor: () => {},
    reloadTheme: () => {}
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState('system');
    const [accentColor, setAccentColor] = useState('#8B5CF6');

    const applyTheme = (currentTheme, color) => {
        const root = document.documentElement;
        
        // Handle dark/light mode
        const isDark = currentTheme === 'dark' || 
            (currentTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        
        if (isDark) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }

        // Apply custom accent color if it exists
        if (color) {
            root.style.setProperty('--primary-500', color);
        } else {
            root.style.removeProperty('--primary-500');
        }
    };

    const reloadTheme = async () => {
        const token = localStorage.getItem(ACCESS_TOKEN);
        if (!token) return;

        try {
            const { settings } = await fetchSettings();
            if (settings) {
                if (settings.theme_preference) setTheme(settings.theme_preference);
                if (settings.default_form_color) setAccentColor(settings.default_form_color);
            }
        } catch (err) {
            console.error('Failed to load theme settings', err);
        }
    };

    // Initial load
    useEffect(() => {
        reloadTheme();
    }, []);

    // Apply when theme or color state changes
    useEffect(() => {
        applyTheme(theme, accentColor);
        
        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = () => applyTheme('system', accentColor);
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [theme, accentColor]);

    return (
        <ThemeContext.Provider value={{ theme, accentColor, setTheme, setAccentColor, reloadTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
