import React, { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';

const WebcamProctor = forwardRef(({ onReady, onSnapshot }, ref) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const [hasPermission, setHasPermission] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let isMounted = true;
        const initCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
                });
                
                if (!isMounted) {
                    stream.getTracks().forEach(t => t.stop());
                    return;
                }
                
                streamRef.current = stream;
                setHasPermission(true);
                onReady(true);
            } catch (err) {
                if (isMounted) {
                    setError('Camera permission is required to take this assessment. Please allow camera access.');
                    onReady(false);
                }
            }
        };

        initCamera();

        return () => {
            isMounted = false;
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [onReady]);

    useEffect(() => {
        if (hasPermission && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [hasPermission]);

    const captureSnapshot = useCallback(() => {
        if (!videoRef.current || !canvasRef.current || !hasPermission) return null;
        
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        if (video.videoWidth === 0 || video.videoHeight === 0) return null;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // compress heavily to save bandwidth
        const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
        if (onSnapshot) {
            onSnapshot(dataUrl);
        }
        return dataUrl;
    }, [hasPermission, onSnapshot]);

    // Expose capture method to parent via imperative handle or effect
    // We will just do a periodic capture here
    useEffect(() => {
        if (!hasPermission) return;
        
        // Take a snapshot every 30 seconds
        const interval = setInterval(() => {
            captureSnapshot();
        }, 30000);
        
        return () => clearInterval(interval);
    }, [hasPermission, captureSnapshot]);

    // Provide a way for parent to trigger a snapshot instantly (e.g. on blur)
    useImperativeHandle(ref, () => ({
        captureSnapshot
    }));

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-4 mx-auto"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><line x1="12" y1="13" x2="12" y2="13.01"></line></svg>
                <h3 className="text-xl font-bold mb-2">Camera Access Required</h3>
                <p>{error}</p>
                <button 
                    onClick={() => window.location.reload()}
                    className="mt-6 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (!hasPermission) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-secondary rounded-xl border border-default text-center animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-4 text-primary-500 mx-auto"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><circle cx="12" cy="13" r="3"></circle></svg>
                <h3 className="text-xl font-bold text-primary mb-2">Requesting Camera Access</h3>
                <p className="text-secondary mt-2">
                    This assessment requires webcam proctoring to verify your identity and ensure academic integrity. Your camera will be active and record snapshots during the entire session.
                </p>
            </div>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 w-48 h-36 bg-black rounded-lg overflow-hidden border-2 border-[var(--primary-500)] shadow-xl shadow-[var(--primary-500)]/20 pointer-events-none">
            <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover transform -scale-x-100" 
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs text-white font-medium">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                Recording
            </div>
        </div>
    );
});

export default WebcamProctor;
