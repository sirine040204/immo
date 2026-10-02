import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { apiClient } from '@/services/api/client';
import { Camera, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/components/ui/card';
import * as faceapi from '@vladmandic/face-api';

export function AIFaceSettings() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'camera_active' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);

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
      setModelsLoaded(true);
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
          setMessage("Caméra activée. Cliquez sur Capturer.");
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

  const captureAndRegister = async () => {
    if (!videoRef.current) return;
    setIsRegistering(true);
    setMessage('Analyse de votre visage...');

    try {
      const detection = await faceapi.detectSingleFace(videoRef.current)
        .withFaceLandmarks()
        .withFaceDescriptor();
      
      if (!detection) {
        throw new Error("Aucun visage détecté. Veuillez vous placer bien en face.");
      }

      const descriptor = Array.from(detection.descriptor);

      const response = await apiClient.post('/api/v1/accounts/ai-face/register/', { descriptor });

      setStatus('success');
      setMessage(response.data.message || 'Visage enregistré avec succès !');
      stopCamera();
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.error || error.message || 'Erreur lors de la capture.';
      setMessage(msg);
      if (status !== 'success') setStatus('camera_active');
    } finally {
      setIsRegistering(false);
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <Card className="mt-6 border border-gray-100 shadow-sm overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-800">
          <Camera className="w-5 h-5 text-brand-green" />
          Reconnaissance Faciale
        </CardTitle>
        <CardDescription>
          Connectez-vous d'un simple regard à la webcam.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {status === 'idle' && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">
                L'application utilisera votre webcam pour vous reconnaître instantanément lors de votre prochaine connexion.
              </p>
            </div>
            <Button 
              onClick={loadModels} 
              className="whitespace-nowrap bg-[#1b4a3a] hover:bg-[#2d6a55] text-white"
            >
              Scanner mon visage
            </Button>
          </div>
        )}

        {(status === 'loading' || status === 'camera_active' || isRegistering) && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-gray-600">{message}</p>
            <div className="relative w-full max-w-sm rounded-lg overflow-hidden bg-gray-100 aspect-video shadow-inner">
              <video 
                ref={videoRef} 
                className="w-full h-full object-cover" 
                autoPlay 
                muted 
                playsInline
              />
            </div>
            {status === 'camera_active' && (
              <Button 
                onClick={captureAndRegister} 
                disabled={isRegistering}
                className="w-full max-w-sm bg-brand-green hover:bg-[#2d6a55]"
              >
                {isRegistering ? 'Analyse...' : 'Capturer le visage'}
              </Button>
            )}
            <Button 
                variant="outline"
                onClick={() => {
                  stopCamera();
                  setStatus('idle');
                }} 
                className="w-full max-w-sm"
              >
                Annuler
              </Button>
          </div>
        )}

        {status === 'success' && (
          <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-lg flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <p className="text-sm text-green-800">{message}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
