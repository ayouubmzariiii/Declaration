import React from "react";

export function Progress({ step, totalSteps }: { step: number; totalSteps: number }) {
    const stepsData = [
        { label: "Identité & Lieu", icon: "👤" },
        { label: "Type de travaux", icon: "🔨" },
        { label: "Photos", icon: "📷" },
        { label: "Analyse IA", icon: "🤖" },
        { label: "Export PDF", icon: "📄" }
    ];

    return (
        <div className="progress-bar">
            {stepsData.map((s, index) => {
                const currentStep = index + 1;
                const isCompleted = currentStep < step;
                const isActive = currentStep === step;

                return (
                    <React.Fragment key={currentStep}>
                        <div className={`progress-step ${isCompleted ? "completed" : ""} ${isActive ? "active" : ""}`.trim()}>
                            <div className="step-circle">
                                {isCompleted ? "✓" : currentStep}
                            </div>
                            <span className="step-label">{s.label}</span>
                        </div>
                        {currentStep < stepsData.length && (
                            <div className={`step-connector ${isCompleted ? "completed" : ""}`.trim()}></div>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}
