import { Box } from '@mui/material';

const BackgroundAnimation = () => {
    return (
        <Box
            sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                overflow: 'hidden',
                zIndex: 0, // Explicitly behind content (z-10)
                background: 'var(--bg-body)', // Fallback
            }}
        >
            {/* Base Gradient Layer */}
            <Box sx={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'var(--bg-gradient-anim)',
                backgroundSize: '400% 400%',
                animation: 'gradientBG 15s ease infinite',
                opacity: 0.8
            }} />

            {/* Blob 1 - Top Left - Purple/Blue */}
            <Box
                sx={{
                    position: 'absolute',
                    top: '-20%',
                    left: '-20%',
                    width: '70vw',
                    height: '70vw',
                    background: 'radial-gradient(circle, rgba(147, 51, 234, 0.4) 0%, rgba(147, 51, 234, 0) 70%)',
                    borderRadius: '50%',
                    filter: 'blur(60px)',
                    animation: 'floatBlob1 25s infinite alternate ease-in-out',
                }}
            />

            {/* Blob 2 - Bottom Right - Cyan/Teal */}
            <Box
                sx={{
                    position: 'absolute',
                    bottom: '-20%',
                    right: '-20%',
                    width: '60vw',
                    height: '60vw',
                    background: 'radial-gradient(circle, rgba(6, 182, 212, 0.4) 0%, rgba(6, 182, 212, 0) 70%)',
                    borderRadius: '50%',
                    filter: 'blur(50px)',
                    animation: 'floatBlob2 30s infinite alternate-reverse ease-in-out',
                }}
            />

            {/* Blob 3 - Center Moving - Pink/Magenta */}
            <Box
                sx={{
                    position: 'absolute',
                    top: '30%',
                    left: '30%',
                    width: '50vw',
                    height: '50vw',
                    background: 'radial-gradient(circle, rgba(236, 72, 153, 0.35) 0%, rgba(236, 72, 153, 0) 70%)',
                    borderRadius: '50%',
                    filter: 'blur(70px)',
                    animation: 'floatBlob3 20s infinite alternate ease-in-out',
                }}
            />

            {/* Dotted Grid Overlay - Increased Visibility */}
            <Box sx={{
                position: 'absolute',
                top: 0, left: 0, width: '100%', height: '100%',
                backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.2) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
                opacity: 0.6, // Increased as requested
                zIndex: 1
            }} />

            {/* Shooting Stars Animation */}
            {[...Array(6)].map((_, i) => (
                <Box
                    key={i}
                    sx={{
                        position: 'absolute',
                        top: `${Math.random() * 50}%`,
                        left: `${Math.random() * 80}%`,
                        width: '150px',
                        height: '2px',
                        background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 100%)',
                        transform: 'rotate(-45deg)',
                        opacity: 0,
                        animation: `shootingStar 4s linear infinite`,
                        animationDelay: `${Math.random() * 5}s`,
                        zIndex: 2,
                        boxShadow: '0 0 10px rgba(255, 255, 255, 0.5)',
                    }}
                />
            ))}

            {/* Bright Floating Particles */}
            {[...Array(8)].map((_, i) => (
                <Box
                    key={`p-${i}`}
                    sx={{
                        position: 'absolute',
                        width: Math.random() < 0.5 ? '10px' : '15px',
                        height: Math.random() < 0.5 ? '10px' : '15px',
                        background: 'rgba(255, 255, 255, 0.6)', // High opacity white
                        borderRadius: '50%',
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        animation: `floatParticle 10s linear infinite`,
                        animationDelay: `${-Math.random() * 10}s`,
                        zIndex: 2,
                        boxShadow: '0 0 10px rgba(255, 255, 255, 0.5)',
                    }}
                />
            ))}

            <style>
                {`
                    @keyframes floatBlob1 {
                        0% { transform: translate(0, 0) scale(1); }
                        100% { transform: translate(50px, 80px) scale(1.1); }
                    }
                    @keyframes floatBlob2 {
                        0% { transform: translate(0, 0) rotate(0deg); }
                        100% { transform: translate(-60px, -40px) rotate(20deg); }
                    }
                    @keyframes floatBlob3 {
                        0% { transform: translate(0, 0) scale(0.9); }
                        50% { transform: translate(40px, -60px) scale(1.2); }
                        100% { transform: translate(-30px, 40px) scale(1.0); }
                    }
                    
                    @keyframes shootingStar {
                        0% { transform: translateX(0) translateY(0) rotate(-45deg); opacity: 0; }
                        10% { opacity: 1; }
                        20% { opacity: 0; transform: translateX(-200px) translateY(200px) rotate(-45deg); }
                        100% { opacity: 0; transform: translateX(-200px) translateY(200px) rotate(-45deg); }
                    }

                    @keyframes floatParticle {
                         0% { transform: translateY(0); opacity: 0.3; }
                         50% { opacity: 1; }
                         100% { transform: translateY(-100px); opacity: 0.3; }
                    }

                    /* Dark Mode Enhancements */
                    [data-theme="dark"] .blob { opacity: 0.6; filter: blur(80px); }
                `}
            </style>
        </Box>
    );
};

export default BackgroundAnimation;
