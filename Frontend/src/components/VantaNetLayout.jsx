import React, { useEffect, useRef } from 'react';

/**
 * Shared layout: Vanta NET (maroon) on black background.
 * Use for all app pages except login.
 */
const VantaNetLayout = ({ children }) => {
  const vantaRef = useRef(null);

  useEffect(() => {
    let vantaEffect = null;

    const initVanta = () => {
      if (vantaRef.current && window.VANTA && window.THREE) {
        try {
          vantaEffect = window.VANTA.NET({
            el: vantaRef.current,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            scale: 1.00,
            scaleMobile: 1.50,
            color: 0x800000,
            backgroundColor: 0x000000,
            points: 12.00,
            maxDistance: 22.00,
            spacing: 17.00
          });
        } catch (error) {
          console.error('[VANTA] NET init error:', error);
        }
      } else {
        setTimeout(initVanta, 100);
      }
    };

    if (document.readyState === 'complete') {
      initVanta();
    } else {
      window.addEventListener('load', initVanta);
    }

    return () => {
      if (vantaEffect && typeof vantaEffect.destroy === 'function') {
        vantaEffect.destroy();
      }
      window.removeEventListener('load', initVanta);
    };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      minHeight: '100vh',
      margin: 0,
      padding: 0,
      overflow: 'hidden',
      boxSizing: 'border-box',
      backgroundColor: '#000000'
    }}>
      <div
        ref={vantaRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0
        }}
      />
      <div style={{
        position: 'relative',
        zIndex: 10,
        width: '100%',
        height: '100%',
        minHeight: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        background: 'transparent'
      }}>
        {children}
      </div>
    </div>
  );
};

export default VantaNetLayout;
