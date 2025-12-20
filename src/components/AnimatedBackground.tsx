import React from 'react';

interface AnimatedBackgroundProps {
    variant?: 'mesh' | 'particles' | 'aurora' | 'gradient';
    className?: string;
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
    variant = 'mesh',
    className = ''
}) => {
    if (variant === 'particles') {
        return (
            <div className={`fixed inset-0 pointer-events-none overflow-hidden ${className}`}>
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-2 h-2 rounded-full bg-primary/20 float-particle"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 6}s`,
                            animationDuration: `${6 + Math.random() * 4}s`,
                        }}
                    />
                ))}
            </div>
        );
    }

    if (variant === 'aurora') {
        return (
            <div className={`fixed inset-0 pointer-events-none overflow-hidden ${className}`}>
                <div className="aurora-bg absolute inset-0" />
            </div>
        );
    }

    if (variant === 'gradient') {
        return (
            <div className={`fixed inset-0 pointer-events-none overflow-hidden ${className}`}>
                <div className="absolute inset-0 gradient-shift opacity-30" />
            </div>
        );
    }

    // Default: mesh
    return (
        <div className={`fixed inset-0 pointer-events-none overflow-hidden ${className}`}>
            <div
                className="absolute inset-0 opacity-40"
                style={{ background: 'var(--gradient-mesh)' }}
            />
            {/* Floating orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-3xl float-particle" />
            <div
                className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-blue-accent/10 blur-3xl float-particle"
                style={{ animationDelay: '2s' }}
            />
        </div>
    );
};

export default AnimatedBackground;
