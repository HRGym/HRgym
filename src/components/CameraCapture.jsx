import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, Check, X } from 'lucide-react';

export default function CameraCapture({ onCapture, onCancel }) {
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('user'); // 'user' or 'environment'
  const [hasCamera, setHasCamera] = useState(true);
  const [capturedImg, setCapturedImg] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Start the video stream
  const startCamera = async (mode = facingMode) => {
    stopCamera(); // Clean up existing streams first
    setErrorMsg('');
    
    try {
      const constraints = {
        video: {
          facingMode: mode,
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access failed:", err);
      setHasCamera(false);
      setErrorMsg("Could not access camera. Make sure permissions are granted.");
    }
  };

  // Stop video tracks
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const toggleCameraFacing = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Matches canvas dimensions with video aspect ratio
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      // If we are using the user front-camera, mirror the captured photo for natural view
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Reset transform if it was mirrored
      if (facingMode === 'user') {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }

      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setCapturedImg(dataUrl);
      stopCamera();
    }
  };

  const handleUsePhoto = () => {
    if (capturedImg) {
      onCapture(capturedImg);
    }
  };

  const handleRetake = () => {
    setCapturedImg(null);
    startCamera();
  };

  return (
    <div className="photo-uploader" style={{ width: '100%' }}>
      <div className="camera-preview-container">
        
        {capturedImg ? (
          <img 
            src={capturedImg} 
            alt="Captured preview" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
        ) : (
          <>
            {errorMsg ? (
              <div style={{ padding: '2rem', textAlign: 'center', height: '100%', display: 'flex', alignItems: 'center', color: 'var(--danger)' }}>
                {errorMsg}
              </div>
            ) : (
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline
                style={{ 
                  transform: facingMode === 'user' ? 'scaleX(-1)' : 'none', 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover' 
                }}
              />
            )}
          </>
        )}
        
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div className="camera-actions">
        {capturedImg ? (
          <>
            <button type="button" className="btn btn-secondary" onClick={handleRetake}>
              <RefreshCw size={16} /> Retake / ថតឡើងវិញ
            </button>
            <button type="button" className="btn btn-primary" onClick={handleUsePhoto}>
              <Check size={16} /> Use Photo / ប្រើប្រាស់រូបនេះ
            </button>
          </>
        ) : (
          <>
            {stream && (
              <>
                <button type="button" className="btn btn-secondary" onClick={toggleCameraFacing} title="Switch camera">
                  <RefreshCw size={16} /> Flip / ប្តូរកាមេរ៉ា
                </button>
                <button type="button" className="btn btn-primary" onClick={capturePhoto}>
                  <Camera size={16} /> Capture / ថតរូប
                </button>
              </>
            )}
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              <X size={16} /> Cancel / បោះបង់
            </button>
          </>
        )}
      </div>
    </div>
  );
}
