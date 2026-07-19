import React from 'react';

const SettingsPanel = ({ settings, onChange, isReadOnly }) => {
    // defaults
    const isAntiCheatEnabled = settings?.is_anti_cheat_enabled || false;
    const isTimerEnabled = settings?.is_timer_enabled || false;
    const timeLimitValue = settings?.time_limit_value || 60;
    const timeLimitUnit = settings?.time_limit_unit || 'minutes';
    
    // Theme defaults
    const themePrimaryColor = settings?.theme_primary_color || '#8B5CF6';
    const themeHeaderImage = settings?.theme_header_image || '';

    const handleToggleAntiCheat = () => {
        onChange({ ...settings, is_anti_cheat_enabled: !isAntiCheatEnabled });
    };

    const handleToggleTimer = () => {
        onChange({ ...settings, is_timer_enabled: !isTimerEnabled });
    };

    const handleTimeLimitValueChange = (e) => {
        const val = parseInt(e.target.value, 10);
        onChange({ ...settings, time_limit_value: isNaN(val) ? 1 : Math.max(1, val) });
    };

    const handleTimeLimitUnitChange = (e) => {
        onChange({ ...settings, time_limit_unit: e.target.value });
    };

    const handleThemeColorChange = (e) => {
        onChange({ ...settings, theme_primary_color: e.target.value });
    };

    const handleThemeHeaderChange = (e) => {
        onChange({ ...settings, theme_header_image: e.target.value });
    };

    return (
        <div className="flex flex-col gap-6">
            <section className="rounded-xl border border-default bg-secondary overflow-hidden shadow-sm">
                <div className="p-6 pb-2">
                    <h2 className="text-xl font-normal text-primary">Form Settings</h2>
                    <p className="text-sm text-secondary mt-1">Manage how responses are collected and protected.</p>
                </div>
                
                <div className="flex flex-col">
                    {/* Anti Cheat Setting */}
                    <div className="flex items-center justify-between p-6 border-b border-default hover:bg-tertiary transition-colors">
                        <div>
                            <h3 className="text-base font-normal text-primary">Anti-Cheat Protection</h3>
                            <p className="text-sm text-secondary">Prevent users from copy-pasting, switching tabs, or using dev tools during the assessment.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={isAntiCheatEnabled}
                                onChange={handleToggleAntiCheat}
                                disabled={isReadOnly}
                            />
                            <div className="w-11 h-6 bg-tertiary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary-500)] peer-checked:border-[var(--primary-500)] border border-default"></div>
                        </label>
                    </div>

                    {/* Timer Setting */}
                    <div className="flex flex-col p-6 hover:bg-tertiary transition-colors">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-normal text-primary">Time Limit</h3>
                                <p className="text-sm text-secondary">Enforce a maximum duration for answering the form.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={isTimerEnabled}
                                    onChange={handleToggleTimer}
                                    disabled={isReadOnly}
                                />
                                <div className="w-11 h-6 bg-tertiary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary-500)] peer-checked:border-[var(--primary-500)] border border-default"></div>
                            </label>
                        </div>

                        {isTimerEnabled && (
                            <div className="mt-4 flex items-center gap-3 ml-4">
                                <label className="text-sm text-secondary">Time limit:</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={timeLimitValue}
                                        onChange={handleTimeLimitValueChange}
                                        disabled={isReadOnly}
                                        min="1"
                                        className="w-20 bg-transparent text-sm text-primary placeholder:text-muted focus:outline-none border-b border-default focus:border-primary-500 transition-colors disabled:cursor-not-allowed disabled:opacity-70 p-1 text-center"
                                    />
                                    <select
                                        value={timeLimitUnit}
                                        onChange={handleTimeLimitUnitChange}
                                        disabled={isReadOnly}
                                        className="bg-transparent text-sm text-primary focus:outline-none border-b border-default focus:border-primary-500 transition-colors disabled:cursor-not-allowed disabled:opacity-70 p-1 cursor-pointer"
                                    >
                                        <option value="seconds" className="bg-secondary">Seconds</option>
                                        <option value="minutes" className="bg-secondary">Minutes</option>
                                        <option value="hours" className="bg-secondary">Hours</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <section className="rounded-xl border border-default bg-secondary overflow-hidden shadow-sm">
                <div className="p-6 pb-2">
                    <h2 className="text-xl font-normal text-primary">Form Theme</h2>
                    <p className="text-sm text-secondary mt-1">Customize the look and feel of your form.</p>
                </div>
                
                <div className="flex flex-col">
                    {/* Primary Color Setting */}
                    <div className="flex items-center justify-between p-6 border-b border-default hover:bg-tertiary transition-colors">
                        <div>
                            <h3 className="text-base font-normal text-primary">Primary Color</h3>
                            <p className="text-sm text-secondary">The main accent color for your form.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <input
                                type="color"
                                value={themePrimaryColor}
                                onChange={handleThemeColorChange}
                                disabled={isReadOnly}
                                className="w-10 h-10 rounded border border-default cursor-pointer bg-transparent"
                            />
                        </div>
                    </div>

                    {/* Header Image Setting */}
                    <div className="flex flex-col p-6 hover:bg-tertiary transition-colors">
                        <div>
                            <h3 className="text-base font-normal text-primary">Header Image URL</h3>
                            <p className="text-sm text-secondary">Add a custom cover image to the top of your form.</p>
                        </div>
                        <div className="mt-4">
                            <input
                                type="text"
                                placeholder="https://example.com/image.jpg"
                                value={themeHeaderImage}
                                onChange={handleThemeHeaderChange}
                                disabled={isReadOnly}
                                className="w-full bg-transparent text-sm text-primary placeholder:text-muted focus:outline-none border-b border-default focus:border-primary-500 transition-colors disabled:cursor-not-allowed disabled:opacity-70 p-2"
                            />
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default SettingsPanel;
