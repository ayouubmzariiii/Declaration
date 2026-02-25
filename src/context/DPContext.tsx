"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { DeclarationPrealable, getInitialDP } from "@/lib/models";

interface DPContextType {
    dp: DeclarationPrealable;
    updateDP: (updater: (prev: DeclarationPrealable) => DeclarationPrealable) => void;
    resetDP: () => void;
}

const DPContext = createContext<DPContextType | undefined>(undefined);

export function DPProvider({ children }: { children: React.ReactNode }) {
    const [dp, setDp] = useState<DeclarationPrealable>(() => {
        // Try to load from localStorage on initial render if in browser
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("dp_state");
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch (e) {
                    console.error("Failed to parse dp_state", e);
                }
            }
        }
        return getInitialDP();
    });

    // Save to localStorage whenever dp changes
    useEffect(() => {
        localStorage.setItem("dp_state", JSON.stringify(dp));
    }, [dp]);

    const updateDP = (updater: (prev: DeclarationPrealable) => DeclarationPrealable) => {
        setDp((prev) => updater(prev));
    };

    const resetDP = () => {
        setDp(getInitialDP());
        localStorage.removeItem("dp_state");
    };

    return (
        <DPContext.Provider value={{ dp, updateDP, resetDP }}>
            {children}
        </DPContext.Provider>
    );
}

export function useDP() {
    const context = useContext(DPContext);
    if (context === undefined) {
        throw new Error("useDP must be used within a DPProvider");
    }
    return context;
}
