'use client';

import React, { useEffect, useState } from 'react';

export function GalleryDebugger() {
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    // Check localStorage
    const authToken = localStorage.getItem('auth_token');
    const debugData = {
      hasAuthToken: !!authToken,
      tokenPreview: authToken ? authToken.substring(0, 20) + '...' : 'None',
      timestamp: new Date().toISOString(),
      localStorage: {
        authToken: !!authToken,
        keys: Object.keys(localStorage)
      }
    };

    // Test API call
    if (authToken) {
      fetch('/api/user/generations', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })
      .then(res => res.json())
      .then(data => {
        setDebugInfo({
          ...debugData,
          apiResponse: {
            success: data.success !== false,
            total: data.total,
            generationsCount: data.generations?.length || 0,
            firstGeneration: data.generations?.[0] ? {
              id: data.generations[0].id,
              hasUrl: !!data.generations[0].output_image_url,
              status: data.generations[0].status
            } : null
          }
        });
      })
      .catch(err => {
        setDebugInfo({
          ...debugData,
          apiError: err.message
        });
      });
    } else {
      setDebugInfo(debugData);
    }

    // Log to console
    console.log('🔍 [GALLERY DEBUGGER] Initial check:', debugData);
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      background: 'rgba(0, 0, 0, 0.9)',
      color: '#fff',
      padding: '15px',
      borderRadius: '8px',
      border: '1px solid #ffd700',
      maxWidth: '400px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999
    }}>
      <div style={{ marginBottom: '10px', fontWeight: 'bold', color: '#ffd700' }}>
        🔍 Gallery Debugger
      </div>
      <pre style={{ margin: 0 }}>
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
      <button
        onClick={() => window.location.reload()}
        style={{
          marginTop: '10px',
          background: '#ffd700',
          color: '#000',
          border: 'none',
          padding: '5px 10px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        Refresh Page
      </button>
    </div>
  );
}