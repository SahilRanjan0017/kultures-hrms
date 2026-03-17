'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

export interface HeaderAction {
    label: string;
    icon?: LucideIcon;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'ghost';
}

interface HeaderContextType {
    title: string;
    setTitle: (title: string) => void;
    description: string;
    setDescription: (description: string) => void;
    actions: HeaderAction[];
    setActions: (actions: HeaderAction[]) => void;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export function HeaderProvider({ children }: { children: ReactNode }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [actions, setActions] = useState<HeaderAction[]>([]);

    return (
        <HeaderContext.Provider value={{ title, setTitle, description, setDescription, actions, setActions }}>
            {children}
        </HeaderContext.Provider>
    );
}

export function useHeader() {
    const context = useContext(HeaderContext);
    if (!context) {
        throw new Error('useHeader must be used within a HeaderProvider');
    }
    return context;
}
