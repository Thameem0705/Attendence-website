import React from 'react';

export const WelcomeScreen = () => {
    return (
        <div className="welcome-screen">
            {/* Animated background orbs */}
            <div className="welcome-orb welcome-orb-1"></div>
            <div className="welcome-orb welcome-orb-2"></div>
            <div className="welcome-orb welcome-orb-3"></div>

            {/* Center content */}
            <div className="welcome-content" style={{ alignItems: 'center', textAlign: 'center' }}>
                {/* Logo */}
                <div className="welcome-logo" style={{ width: '80px', height: '80px', background: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 0 40px rgba(99,102,241,0.4), 0 10px 30px rgba(0,0,0,0.2)' }}>
                    <img src="/logo.png" alt="Sulthan & Co" className="w-full h-full object-contain p-2" />
                </div>

                {/* Brand name */}
                <h1 className="welcome-title" style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', letterSpacing: '0.02em', lineHeight: 1.2 }}>
                    {'SULTHAN & CO'.split('').map((letter, i) => (
                        <span
                            key={i}
                            className="welcome-letter"
                            style={{ animationDelay: `${0.6 + i * 0.06}s` }}
                        >
                            {letter === ' ' ? '\u00A0' : letter}
                        </span>
                    ))}
                </h1>

                {/* Tagline */}
                <p className="welcome-tagline uppercase tracking-widest text-center" style={{ fontSize: 'clamp(0.6rem, 2vw, 0.85rem)', marginTop: '4px' }}>ITP Auditors Attendance</p>

                {/* Progress bar */}
                <div className="welcome-progress-track">
                    <div className="welcome-progress-bar"></div>
                </div>
            </div>
        </div>
    );
};
