import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { apiClient } from '@/services/api/client';
import { Lock, KeyRound, Mail, CheckCircle, AlertCircle, X, Eye, EyeOff } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/components/ui/card';
import { useAuth } from '@/core/auth/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { getUserProfile } from '../api/auth';
import { useEffect } from 'react';

interface ChangePasswordSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordSettings({ isOpen, onClose }: ChangePasswordSettingsProps) {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["userProfile"],
    queryFn: getUserProfile,
    enabled: isOpen,
  });

  const [method, setMethod] = useState<'old_password' | 'forgotten'>('old_password');
  const [step, setStep] = useState<'initial' | 'otp_sent' | 'success'>('initial');

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [otpCode, setOtpCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [emailInput, setEmailInput] = useState('');

  useEffect(() => {
    if (profile?.email && !emailInput) {
      setEmailInput(profile.email);
    }
  }, [profile?.email]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Password validation rules (mimicking register Zod schema)
  let passwordError = "";
  if (newPassword.length > 0) {
    if (newPassword.length < 8) passwordError = "Le mot de passe doit contenir au moins 8 caractères.";
    else if (!/[a-z]/.test(newPassword)) passwordError = "Doit contenir au moins une lettre minuscule.";
    else if (!/[A-Z]/.test(newPassword)) passwordError = "Doit contenir au moins une lettre majuscule.";
    else if (!/[0-9]/.test(newPassword)) passwordError = "Doit contenir au moins un chiffre.";
    else if (!/[^a-zA-Z0-9]/.test(newPassword)) passwordError = "Doit contenir au moins un caractère spécial.";
  }
  const isPasswordValid = newPassword.length > 0 && passwordError === "";

  const handleOldPasswordSubmit = async () => {
    if (!oldPassword || !newPassword) {
      setErrorMsg("Veuillez remplir tous les champs.");
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      await apiClient.post('/api/v1/accounts/me/change-password/', {
        old_password: oldPassword,
        new_password: newPassword
      });
      setSuccessMsg("Mot de passe modifié avec succès !");
      setOldPassword('');
      setNewPassword('');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Erreur lors de la modification.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    if (!emailInput) {
      setErrorMsg("Veuillez saisir une adresse email.");
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      await apiClient.post('/api/v1/accounts/password-reset/request/', {
        email: emailInput
      });
      setStep('otp_sent');
      setSuccessMsg(`Un code a été envoyé à ${emailInput}`);
    } catch (err: any) {
      setErrorMsg("Erreur lors de l'envoi du code.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTPAndChange = async () => {
    if (!otpCode || !newPassword) {
      setErrorMsg("Veuillez remplir le code et le nouveau mot de passe.");
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      // 1. Verify OTP
      const verifyRes = await apiClient.post('/api/v1/accounts/password-reset/verify-otp/', {
        otp_code: otpCode
      });

      // 2. Confirm Password Reset
      await apiClient.post('/api/v1/accounts/password-reset/confirm/', {
        token: verifyRes.data.token,
        new_password: newPassword
      });

      setStep('success');
      setSuccessMsg("Mot de passe réinitialisé avec succès !");
      setOtpCode('');
      setNewPassword('');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Code invalide ou erreur.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-1 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 pb-0">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-800">
            <Lock className="w-6 h-6 text-brand-green" />
            Changer le mot de passe
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            Modifiez votre mot de passe pour sécuriser votre compte.
          </p>
        </div>

        <div className="p-6">
          {step !== 'success' && (
            <div className="flex gap-4 mb-6 border-b border-gray-100 pb-4">
              <button
                onClick={() => { setMethod('old_password'); setStep('initial'); setErrorMsg(''); setSuccessMsg(''); }}
                className={`text-sm font-medium pb-2 transition-colors ${method === 'old_password' ? 'text-brand-green border-b-2 border-brand-green' : 'text-gray-500 hover:text-gray-700'}`}
              >
                J'ai mon ancien mot de passe
              </button>
              <button
                onClick={() => { setMethod('forgotten'); setStep('initial'); setErrorMsg(''); setSuccessMsg(''); }}
                className={`text-sm font-medium pb-2 transition-colors ${method === 'forgotten' ? 'text-brand-green border-b-2 border-brand-green' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Mot de passe oublié ?
              </button>
            </div>
          )}

          {method === 'old_password' && (
            <div className="space-y-4 max-w-md">
              <div className="space-y-1.5">
                <Label>Ancien mot de passe</Label>
                <div className="relative">
                  <Input
                    type={showOldPassword ? "text" : "password"}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Votre mot de passe actuel"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Votre nouveau mot de passe"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-[0.8rem] font-medium text-red-500 mt-1">{passwordError}</p>
                )}
              </div>
              <Button
                onClick={handleOldPasswordSubmit}
                disabled={loading || !isPasswordValid}
                className="bg-[#1b4a3a] hover:bg-[#2d6a55] w-full mt-2 text-white"
              >
                {loading ? 'Modification...' : 'Enregistrer le mot de passe'}
              </Button>
            </div>
          )}

          {method === 'forgotten' && step === 'initial' && (
            <div className="space-y-4 max-w-md">
              <p className="text-sm text-gray-600">
                Veuillez confirmer l'adresse email pour recevoir un code de sécurité. Vous pouvez utiliser votre adresse principale ({profile?.email ? <b>{profile.email}</b> : "chargement..."}) ou bien renseigner une autre adresse liée à votre compte.
              </p>
              <div className="space-y-1.5">
                <Label>Adresse email</Label>
                <Input 
                  type="email" 
                  value={emailInput} 
                  onChange={(e) => setEmailInput(e.target.value)} 
                  placeholder="exemple@entreprise.com"
                />
              </div>
              <Button
                onClick={handleSendOTP}
                disabled={loading || !emailInput}
                className="bg-[#1b4a3a] hover:bg-[#2d6a55] w-full text-white"
              >
                {loading ? 'Envoi...' : 'Recevoir le code par email'}
              </Button>
            </div>
          )}

          {method === 'forgotten' && step === 'otp_sent' && (
            <div className="space-y-4 max-w-md">
              <div className="space-y-1.5">
                <Label>Code de sécurité</Label>
                <Input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="Entrez le code reçu par email"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Votre nouveau mot de passe"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-[0.8rem] font-medium text-red-500 mt-1">{passwordError}</p>
                )}
              </div>
              <Button
                onClick={handleVerifyOTPAndChange}
                disabled={loading || !isPasswordValid || otpCode.length < 6}
                className="bg-[#1b4a3a] hover:bg-[#2d6a55] w-full mt-2 text-white"
              >
                {loading ? 'Vérification...' : 'Réinitialiser le mot de passe'}
              </Button>
            </div>
          )}

          {errorMsg && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 max-w-md">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{errorMsg}</p>
            </div>
          )}

          {successMsg && (
            <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-lg flex items-start gap-2 max-w-md">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">{successMsg}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
