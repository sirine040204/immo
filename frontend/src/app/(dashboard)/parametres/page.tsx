"use client";

import React, { useState } from "react";
import { PageHeader } from "@/shared/components/PageHeader";
import { CompanyProfileForm } from "@/features/accounts/components/CompanyProfileForm";
import { CompanyProfileDisplay } from "@/features/accounts/components/CompanyProfileDisplay";

export default function ParametresPage() {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-500">
      <PageHeader
        title="Paramètres de l'entreprise"
        subtitle="Gérez les informations et la configuration de votre entreprise."
      />
      
      {isEditing ? (
        <CompanyProfileForm 
          onCancel={() => setIsEditing(false)} 
          onSuccess={() => setIsEditing(false)} 
        />
      ) : (
        <CompanyProfileDisplay 
          onEditClick={() => setIsEditing(true)} 
        />
      )}
    </div>
  );
}
