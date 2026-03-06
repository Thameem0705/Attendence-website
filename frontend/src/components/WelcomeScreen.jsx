import React from 'react';
import { CalendarCheck } from 'lucide-react';

export const WelcomeScreen = () => {
    return (
        <div className="welcome-screen">
            {/* Animated background orbs */}
            <div className="welcome-orb welcome-orb-1"></div>
            <div className="welcome-orb welcome-orb-2"></div>
            <div className="welcome-orb welcome-orb-3"></div>

            {/* Center content */}
            <div className="welcome-content">
                {/* Logo */}
                <div className="welcome-logo">
                    <div className="welcome-logo-ring"></div>
                    <CalendarCheck className="welcome-logo-icon" />
                </div>

                {/* Brand name */}
                <h1 className="welcome-title">
                    {'AttendSync'.split('').map((letter, i) => (
                        <span
                            key={i}
                            className="welcome-letter"
                            style={{ animationDelay: `${0.6 + i * 0.06}s` }}
                        >
                            {letter}
                        </span>
                    ))}
                </h1>

                {/* Tagline */}
                <p className="welcome-tagline">Smart Attendance Management</p>

                {/* Progress bar */}
                <div className="welcome-progress-track">
                    <div className="welcome-progress-bar"></div>
                </div>
            </div>
        </div>
    );
};
