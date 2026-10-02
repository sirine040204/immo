import React, { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { UploadCloud } from "lucide-react";

import { Document } from "../types/document";
import { createDocument, updateDocument } from "../api/documents";
import { fetchTypeDocuments, fetchTypeDocumentFamilles } from "@/features/documents/api/types-document";
import { fetchImmobilisations } from "@/features/immobilisations/api/immobilisations";
import { TypeDocumentFamille } from "@/features/documents/types/type-document";
import { ImmobilisationStatut } from "@/features/immobilisations/types/immobilisation";

const documentSchema = z.object({
  nom: z.string().min(1, "Le nom est obligatoire"),
  description: z.string().optional(),
  type_document: z.number().min(1, "Veuillez sélectionner un type"),
  immobilisation: z.number().nullable().optional(),
  date_debut_validite: z.string().optional().nullable(),
  date_fin_validite: z.string().optional().nullable(),
}).superRefine((data, ctx) => {  if (data.date_debut_validite && data.date_fin_validite) {
    if (new Date(data.date_fin_validite) < new Date(data.date_debut_validite)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Doit être >= date de début",
        path: ["date_fin_validite"],
      });
    }
  }
});

type DocumentFormValues = z.infer<typeof documentSchema>;

interface DocumentFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  document?: Document | null;
  initialTypeDocument?: number;
  initialImmobilisation?: number;
  onSuccessSubmit?: (documentId: number) => void;
}

export function DocumentFormDialog({
  isOpen,
  onClose,
  document,
  initialTypeDocument,
  initialImmobilisation,
  onSuccessSubmit,
}: DocumentFormDialogProps) {
  const isEditMode = !!document;
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [typeQuery, setTypeQuery] = useState("");
  const [immoQuery, setImmoQuery] = useState("");

  const { data: typeDocuments = [] } = useQuery({
    queryKey: ["type-documents"],
    queryFn: fetchTypeDocuments,
    enabled: isOpen,
  });

  const { data: immobilisations = [] } = useQuery({
    queryKey: ["immobilisations"],
    queryFn: fetchImmobilisations,
    enabled: isOpen,
  });

  const { data: typeDocumentFamilles = [] } = useQuery<TypeDocumentFamille[]>({
    queryKey: ["type-document-familles"],
    queryFn: fetchTypeDocumentFamilles,
    enabled: isOpen,
  });

  // Filter Active Type Documents
  const activeTypeDocuments = useMemo(() =>
    typeDocuments.filter(td => td.statut === "ACTIF"),
    [typeDocuments]
  );

  // Filter valid immobilisations (exclude ARCHIVEE, REFORMEE)
  const validImmobilisations = useMemo(() =>
    immobilisations.filter(imm =>
      imm.statut !== ImmobilisationStatut.ARCHIVEE &&
      imm.statut !== ImmobilisationStatut.REFORMEE
    ),
    [immobilisations]
  );

  const filteredImmos = useMemo(() =>
    validImmobilisations.filter(imm =>
      `${imm.code} ${imm.designation}`.toLowerCase().includes(immoQuery.toLowerCase())
    ),
    [validImmobilisations, immoQuery]
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      nom: "",
      description: "",
      type_document: 0,
      immobilisation: null,
      date_debut_validite: "",
      date_fin_validite: "",
    },
  });

  const watchTypeDocument = watch("type_document");
  const watchImmobilisation = watch("immobilisation");

  const allowedTypeDocIds = useMemo(() => {
    if (!watchImmobilisation) return null;
    const immo = immobilisations.find(i => i.id_immobilisation === watchImmobilisation);
    if (!immo) return null;
    return typeDocumentFamilles
      .filter(tdf => tdf.famille === immo.famille)
      .map(tdf => tdf.type_document);
  }, [watchImmobilisation, immobilisations, typeDocumentFamilles]);

  const filteredTypeDocs = useMemo(() => {
    return activeTypeDocuments.filter(td => {
      const matchesSearch = `${td.nom} ${td.code}`.toLowerCase().includes(typeQuery.toLowerCase());
      const isAllowed = allowedTypeDocIds ? allowedTypeDocIds.includes(td.id_type_document) : true;
      return matchesSearch && isAllowed;
    });
  }, [activeTypeDocuments, typeQuery, allowedTypeDocIds]);

  const selectedTypeObj = useMemo(() =>
    typeDocuments.find(td => td.id_type_document === watchTypeDocument),
    [typeDocuments, watchTypeDocument]
  );

  useEffect(() => {
    if (isOpen) {
      setTypeQuery("");
      setImmoQuery("");
      setFileError("");
    }
    if (isOpen && isEditMode && document) {
      reset({
        nom: document.nom,
        description: document.description || "",
        type_document: document.type_document,
        immobilisation: document.immobilisation || null,
        date_debut_validite: document.date_debut_validite || "",
        date_fin_validite: document.date_fin_validite || "",
      });
      setSelectedFile(null);
    } else if (isOpen && !isEditMode) {
      reset({
        nom: "",
        description: "",
        type_document: initialTypeDocument || 0,
        immobilisation: initialImmobilisation || null,
        date_debut_validite: "",
        date_fin_validite: "",
      });
      setSelectedFile(null);
    }
  }, [isOpen, isEditMode, document, reset, initialTypeDocument, initialImmobilisation]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        toast.error("La taille du fichier ne doit pas dépasser 10 MB.");
        e.target.value = "";
        return;
      }
      const allowedExtensions = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".jpg", ".jpeg", ".png"];
      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        toast.error(`Format non autorisé. Formats acceptés : ${allowedExtensions.join(", ")}`);
        e.target.value = "";
        return;
      }
      setSelectedFile(file);
      setFileError("");
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (data: DocumentFormValues) => {
      // Prepare values
      const payload: any = {
        ...data,
        immobilisation: data.immobilisation === 0 ? null : data.immobilisation,
        date_debut_validite: data.date_debut_validite || null,
        date_fin_validite: data.date_fin_validite || null,
      };

      if (!selectedTypeObj?.a_echeance) {
        payload.date_debut_validite = null;
        payload.date_fin_validite = null;
      }

      if (isEditMode) {
        return updateDocument({
          id: document!.id,
          data: {
            ...payload,
            fichier: selectedFile, // can be null if not changed
          },
        });
      } else {
        return createDocument({
          ...payload,
          fichier: selectedFile!, // guaranteed by front check
        });
      }
    },
    onSuccess: (responseData, variables) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      if (variables.immobilisation) {
        queryClient.invalidateQueries({ queryKey: ["documents-requis", variables.immobilisation] });
      }
      toast.success(isEditMode ? "Document modifié avec succès" : "Document créé avec succès");
      
      // If a callback was provided, return the newly created/updated document ID
      if (onSuccessSubmit && responseData?.id) {
        onSuccessSubmit(responseData.id);
      }
      
      onClose();
    },
    onError: (error: any) => {
      const errorData = error.response?.data;
      if (errorData && typeof errorData === "object") {
        Object.entries(errorData).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            toast.error(`${key}: ${value[0]}`);
          } else {
            toast.error(value as string);
          }
        });
      } else {
        toast.error("Une erreur est survenue.");
      }
    },
  });

  const onSubmit = (data: DocumentFormValues) => {
    if (!isEditMode && !selectedFile) {
      setFileError("Veuillez sélectionner un fichier.");
      toast.error("Veuillez sélectionner un fichier (PDF recommandé).");
      return;
    }
    setFileError("");

    if (selectedTypeObj?.a_echeance && !data.date_fin_validite) {
      toast.error("La date de fin de validité est obligatoire pour ce type de document.");
      return;
    }

    saveMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-900">
            {isEditMode ? "Modifier le document" : "Nouveau document"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">

          <div className="grid grid-cols-2 gap-4">
            {/* Nom */}
            <div className="space-y-2 col-span-2">
              <Label htmlFor="nom">Nom du document *</Label>
              <Input
                id="nom"
                placeholder="Ex: Contrat de maintenance..."
                {...register("nom")}
                className={errors.nom ? "border-red-500" : ""}
              />
              {errors.nom && (
                <p className="text-xs text-red-500">{errors.nom.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Type de Document */}
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="type_document">Type de document *</Label>
              <Select
                value={watchTypeDocument ? watchTypeDocument.toString() : ""}
                onValueChange={(val) => setValue("type_document", Number(val), { shouldValidate: true })}
              >
                <SelectTrigger className={errors.type_document ? "border-red-500" : ""}>
                  <SelectValue placeholder="Sélectionner un type...">
                    {watchTypeDocument
                      ? (activeTypeDocuments.find(t => t.id_type_document === watchTypeDocument)
                        ? `${activeTypeDocuments.find(t => t.id_type_document === watchTypeDocument)!.nom} (${activeTypeDocuments.find(t => t.id_type_document === watchTypeDocument)!.code})`
                        : (isEditMode && document && document.type_document === watchTypeDocument ? "(Type actuel archivé)" : watchTypeDocument.toString()))
                      : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2 pb-1 sticky top-0 bg-popover z-10 border-b border-border/50">
                    <input
                      type="text"
                      className="w-full h-8 px-2 text-sm rounded-md border border-input bg-transparent outline-none focus:ring-2 focus:ring-ring focus:border-input"
                      placeholder="Rechercher..."
                      value={typeQuery}
                      onChange={(e) => setTypeQuery(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </div>
                  {isEditMode && document && !activeTypeDocuments.find(t => t.id_type_document === document.type_document) && (
                    <SelectItem value={document.type_document.toString()}>
                      (Type actuel archivé)
                    </SelectItem>
                  )}
                  {filteredTypeDocs.map((td) => (
                    <SelectItem key={td.id_type_document} value={td.id_type_document.toString()}>
                      {`${td.nom} (${td.code})`}
                    </SelectItem>
                  ))}
                  {filteredTypeDocs.length === 0 && (
                    <div className="p-2 text-sm text-center text-slate-500">Aucun résultat</div>
                  )}
                </SelectContent>
              </Select>
              {errors.type_document && (
                <p className="text-xs text-red-500">{errors.type_document.message}</p>
              )}
            </div>

            {/* Immobilisation */}
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="immobilisation">Immobilisation liée</Label>
              <Select
                value={watch("immobilisation") ? watch("immobilisation")?.toString() : "0"}
                onValueChange={(val) => setValue("immobilisation", val === "0" ? null : Number(val))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner...">
                    {watch("immobilisation") !== null && watch("immobilisation") !== undefined
                      ? (validImmobilisations.find(i => i.id_immobilisation === watch("immobilisation"))
                        ? `${validImmobilisations.find(i => i.id_immobilisation === watch("immobilisation"))!.code} - ${validImmobilisations.find(i => i.id_immobilisation === watch("immobilisation"))!.designation}`
                        : (isEditMode && document && document.immobilisation === watch("immobilisation") ? "(Immobilisation actuelle archivée/réformée)" : watch("immobilisation")?.toString()))
                      : "Aucune immobilisation"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2 pb-1 sticky top-0 bg-popover z-10 border-b border-border/50">
                    <input
                      type="text"
                      className="w-full h-8 px-2 text-sm rounded-md border border-input bg-transparent outline-none focus:ring-2 focus:ring-ring focus:border-input"
                      placeholder="Rechercher..."
                      value={immoQuery}
                      onChange={(e) => setImmoQuery(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </div>
                  <SelectItem value="0">Aucune immobilisation</SelectItem>
                  {isEditMode && document?.immobilisation && !validImmobilisations.find(i => i.id_immobilisation === document.immobilisation) && (
                    <SelectItem value={document.immobilisation.toString()}>
                      (Immobilisation actuelle archivée/réformée)
                    </SelectItem>
                  )}
                  {filteredImmos.map((imm) => (
                    <SelectItem key={imm.id_immobilisation} value={imm.id_immobilisation.toString()}>
                      {`${imm.code} - ${imm.designation}`}
                    </SelectItem>
                  ))}
                  {filteredImmos.length === 0 && (
                    <div className="p-2 text-sm text-center text-slate-500">Aucun résultat</div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Conditional Dates for a_echeance */}
          {selectedTypeObj?.a_echeance && (
            <div className="grid grid-cols-2 gap-4 bg-amber-50 p-4 rounded-lg border border-amber-100">
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="date_debut_validite">Date début de validité</Label>
                <Input
                  id="date_debut_validite"
                  type="date"
                  {...register("date_debut_validite")}
                />
              </div>

              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="date_fin_validite">Date fin de validité *</Label>
                <Input
                  id="date_fin_validite"
                  type="date"
                  {...register("date_fin_validite")}
                  className={errors.date_fin_validite ? "border-red-500" : ""}
                />
                {errors.date_fin_validite && (
                  <p className="text-xs text-red-500">{errors.date_fin_validite.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Détails supplémentaires..."
              {...register("description")}
              className="resize-none"
              rows={3}
            />
          </div>

          {/* Fichier */}
          <div className="space-y-2 p-4 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
            <Label htmlFor="fichier" className="flex flex-col items-center justify-center cursor-pointer">
              <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
              <span className="text-sm font-medium text-slate-700">
                {selectedFile ? selectedFile.name : (isEditMode ? "Changer le fichier (optionnel)" : "Sélectionner un fichier PDF *")}
              </span>
              <span className="text-xs text-slate-500 mt-1">Max 10 MB. PDF recommandé.</span>
            </Label>
            <input
              id="fichier"
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              className="hidden"
              onChange={handleFileChange}
            />
            {isEditMode && !selectedFile && document?.fichier && (
              <div className="text-center mt-2">
                <a href={document.fichier} target="_blank" rel="noreferrer" className="text-xs text-brand-green hover:underline">
                  Fichier actuel joint
                </a>
              </div>
            )}
            {fileError && (
              <div className="text-center mt-2">
                <span className="text-xs text-red-500">{fileError}</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saveMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={saveMutation.isPending}
              className="bg-brand-green hover:bg-brand-green-hover text-white"
            >
              {saveMutation.isPending
                ? "Enregistrement..."
                : isEditMode
                  ? "Mettre à jour"
                  : "Créer le document"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
