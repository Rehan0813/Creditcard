import { useEffect, useRef } from 'react';

const VantaBackground = () => {
    const vantaRef = useRef(null);
    const vantaEffect = useRef(null);

    useEffect(() => {
        // Load THREE.js script
        const loadScript = (src) => {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = src;
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        };

        const initVanta = async () => {
            try {
                // Load scripts if not already loaded
                if (!window.THREE) {
                    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js');
                }
                if (!window.VANTA) {
                    await loadScript('https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.dots.min.js');
                }

                // Initialize Vanta
                if (vantaRef.current && !vantaEffect.current) {
                    vantaEffect.current = window.VANTA.DOTS({
                        el: vantaRef.current,
                        mouseControls: true,
                        touchControls: true,
                        gyroControls: false,
                        minHeight: 200.00,
                        minWidth: 200.00,
                        scale: 1.00,
                        scaleMobile: 1.00,
                        backgroundColor: 0x222222,
                        color: 0xff8820,
                        color2: 0xff8820,
                        size: 3,
                        spacing: 35,
                        showLines: true
                    });
                    console.log('✅ Vanta DOTS initialized');
                }
            } catch (error) {
                console.error('❌ Vanta init error:', error);
            }
        };

        initVanta();

        return () => {
            if (vantaEffect.current) {
                vantaEffect.current.destroy();
                vantaEffect.current = null;
            }
        };
    }, []);

    return (
        <div
            ref={vantaRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 0
            }}
        />
    );
};

export default VantaBackground;
