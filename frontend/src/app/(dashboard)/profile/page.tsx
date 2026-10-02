"use client";

import React, { useState } from "react";
import { PageHeader } from "@/shared/components/PageHeader";
import { UserProfileForm } from "@/features/accounts/components/UserProfileForm";
import { UserProfileDisplay } from "@/features/accounts/components/UserProfileDisplay";
import { WebAuthnSettings } from "@/features/accounts/components/WebAuthnSettings";
import { AIFaceSettings } from "@/features/accounts/components/AIFaceSettings";
import { ChangePasswordSettings } from "@/features/accounts/components/ChangePasswordSettings";
import { UserPermissionRequestsList } from "@/features/accounts/components/UserPermissionRequestsList";

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-500">
      <PageHeader
        title="Profil de l'utilisateur"
        subtitle="Gérez vos informations personnelles et préférences."
      />

      {isEditing ? (
        <UserProfileForm
          onCancel={() => setIsEditing(false)}
          onSuccess={() => setIsEditing(false)}
        />
      ) : (
        <UserProfileDisplay
          onEditClick={() => setIsEditing(true)}
          onChangePasswordClick={() => setIsChangingPassword(true)}
        />
      )}

      {!isEditing && (
        <div className="space-y-6">
          <WebAuthnSettings />
          <AIFaceSettings />
          <UserPermissionRequestsList />
        </div>
      )}

      <ChangePasswordSettings
        isOpen={isChangingPassword}
        onClose={() => setIsChangingPassword(false)}
      />
    </div>
  );
}
