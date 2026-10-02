import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { apiClient } from '@/services/api/client';
import { startRegistration } from '@simplewebauthn/browser';
import { Fingerprint, CheckCircle, AlertCircle, ShieldCheck, Smartphone, Laptop } from 'lucide-react';

export function WebAuthnSettings() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const registerPasskey = async () => {
    try {
      setIsRegistering(true);
      setStatus('idle');
      setMessage('');

      // 1. Get registration options from server
      const { data: options } = await apiClient.get('/api/v1/accounts/webauthn/register/options/');

      // 2. Pass options to browser to generate credential
      let attResp;
      try {
        attResp = await startRegistration({ optionsJSON: options });
      } catch (error: any) {
        if (error.name === 'NotAllowedError') {
          throw new Error('Opération annulée ou refusée par votre navigateur.');
        } else if (error.name === 'NotSupportedError') {
          throw new Error('Votre navigateur ou appareil ne supporte pas Face ID / Passkeys.');
        } else if (error.name === 'InvalidStateError') {
          throw new Error('Cet appareil est déjà enregistré et lié à votre compte !');
        }
        throw error;
      }

      // 3. Verify the new credential on the server
      const { data: verification } = await apiClient.post('/api/v1/accounts/webauthn/register/verify/', attResp);

      setStatus('success');
      setMessage(verification.message || 'Passkey enregistré avec succès ! Vous pouvez maintenant utiliser Face ID ou votre empreinte pour vous connecter.');
    } catch (error: any) {
      console.error(error);
      setStatus('error');
      setMessage(error.response?.data?.error || error.message || 'Une erreur est survenue lors de la configuration.');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="mt-8 border border-slate-200 shadow-lg shadow-brand-green/5 rounded-2xl overflow-hidden bg-white relative">
      {/* Decorative gradient background */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-brand-green/10 to-transparent pointer-events-none" />

      <div className="p-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8 border-b border-slate-100 pb-8">
          <div className="flex gap-5">
            <div className="relative">
              <div className="absolute inset-0 bg-brand-green/20 blur-xl rounded-full animate-pulse" />
              <div className="relative h-16 w-16 bg-gradient-to-br from-brand-green to-[#0e3b2c] rounded-2xl flex items-center justify-center text-white shadow-md border border-brand-green/50">
                <Fingerprint className="w-8 h-8" strokeWidth={1.5} />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Authentification par Passkey</h3>
              <p className="text-sm text-slate-600 max-w-lg leading-relaxed">
                Transformez votre appareil en clé de sécurité. Connectez-vous instantanément avec <span className="font-semibold text-slate-900">Face ID, Touch ID ou Windows Hello</span> sans avoir à mémoriser de mot de passe.
              </p>
              <div className="flex items-center gap-2 mt-4 text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full w-fit border border-emerald-100">
                <ShieldCheck className="w-4 h-4" />
                <span>Sécurité maximale </span>
              </div>
            </div>
          </div>

          <Button
            onClick={registerPasskey}
            disabled={isRegistering}
            className="whitespace-nowrap bg-brand-green hover:bg-[#153b2c] text-white shadow-md shadow-brand-green/20 h-11 px-6 rounded-xl transition-all"
          >
            {isRegistering ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2" />
                Configuration en cours...
              </>
            ) : (
              <>
                Ajouter un appareil
              </>
            )}
          </Button>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">Appareils compatibles</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-600">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Smartphones</p>
                  <p className="text-xs text-slate-500">Face ID / Empreinte</p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-600">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Ordinateurs</p>
                  <p className="text-xs text-slate-500">Windows Hello / Touch ID</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {status === 'success' && (
          <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="bg-emerald-100 p-1.5 rounded-full mt-0.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-emerald-900 text-sm">Appareil enregistré avec succès</p>
              <p className="text-sm text-emerald-700 mt-1">{message}</p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="bg-red-100 p-1.5 rounded-full mt-0.5">
              <AlertCircle className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="font-semibold text-red-900 text-sm">Échec de la configuration</p>
              <p className="text-sm text-red-700 mt-1">{message}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
