import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { apiClient } from '@/services/api/client';
import { Camera, CheckCircle, AlertCircle, X } from 'lucide-react';
import * as faceapi from '@vladmandic/face-api';

interface AIFaceLoginModalProps {
  email: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
}

export function AIFaceLoginModal({ email, isOpen, onClose, onSuccess }: AIFaceLoginModalProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'camera_active' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadModels();
    } else {
      stopCamera();
      setStatus('idle');
      setMessage('');
    }
  }, [isOpen]);

  const loadModels = async () => {
    try {
      setStatus('loading');
      setMessage('Chargement des modèles d\'IA...');
      const MODEL_URL = 'https://vladmandic.github.io/face-api/model/';
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ]);
      setMessage('Modèles chargés. Veuillez vous placer devant la caméra.');
      startCamera();
    } catch (e: any) {
      console.error(e);
      setStatus('error');
      setMessage("Erreur lors du chargement des modèles IA.");
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setStatus('camera_active');
          setMessage("Caméra activée. Cliquez sur Se Connecter.");
        };
      }
    } catch (err: any) {
      setStatus('error');
      setMessage("Erreur d'accès à la caméra. Autorisez-la !");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const captureAndLogin = async () => {
    if (!videoRef.current) return;
    setIsLoggingIn(true);
    setMessage('Analyse de votre visage...');

    try {
      const detection = await faceapi.detectSingleFace(videoRef.current)
        .withFaceLandmarks()
        .withFaceDescriptor();
      
      if (!detection) {
        throw new Error("Aucun visage détecté. Veuillez vous placer bien en face.");
      }

      const descriptor = Array.from(detection.descriptor);

      const response = await apiClient.post('/api/v1/accounts/ai-face/login/', { email, descriptor });

      setStatus('success');
      setMessage(response.data.message || 'Connexion réussie !');
      stopCamera();
      
      setTimeout(() => {
        onSuccess(response.data);
      }, 1000);

    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.error || error.message || 'Visage non reconnu ou erreur.';
      setMessage(msg);
      if (status !== 'success') setStatus('camera_active');
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-1 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 pb-0">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Camera className="w-6 h-6 text-brand-green" />
            Connexion IA Faciale
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            Connectez-vous à <b>{email}</b> avec la caméra.
          </p>
        </div>

        <div className="p-6 flex flex-col items-center gap-4">
          <div className="relative w-full rounded-lg overflow-hidden bg-gray-900 aspect-video shadow-inner flex items-center justify-center">
            {status === 'loading' && (
              <p className="text-white text-sm animate-pulse">{message}</p>
            )}
            <video 
              ref={videoRef} 
              className={`w-full h-full object-cover ${status === 'loading' ? 'hidden' : 'block'}`}
              autoPlay 
              muted 
              playsInline
            />
          </div>

          <p className="text-sm text-center text-gray-600 font-medium">
            {message}
          </p>

          {status === 'camera_active' && (
            <Button 
              onClick={captureAndLogin} 
              disabled={isLoggingIn}
              className="w-full bg-brand-green hover:bg-[#2d6a55]"
            >
              {isLoggingIn ? 'Analyse...' : 'Se Connecter via IA'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
