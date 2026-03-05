import React, { createContext, useContext, useState } from 'react';

interface SettingsContextType {
    isAlfredVoiceEnabled: boolean;
    toggleAlfredVoice: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [isAlfredVoiceEnabled, setIsAlfredVoiceEnabled] = useState(false);

    const toggleAlfredVoice = () => {
        setIsAlfredVoiceEnabled((prev) => !prev);
    };

    return (
        <SettingsContext.Provider value={{ isAlfredVoiceEnabled, toggleAlfredVoice }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
