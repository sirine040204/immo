import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Edit2, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { Input } from "@/shared/components/ui/input";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "cn";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Badge } from "@/shared/components/ui/badge";
// import { Checkbox } from "@/shared/components/ui/checkbox";
import { Label } from "@/shared/components/ui/label";

import { fetchTypeDocuments } from "@/features/documents/api/types-document";
import { fetchFamilles } from "@/features/immobilisations/api/familles";
import {
  fetchTypeDocumentFamilles,
  createTypeDocumentFamille,
  updateTypeDocumentFamille,
  deleteTypeDocumentFamille,
} from "@/features/documents/api/types-document";
import { TypeDocumentFamille } from "@/features/documents/types/type-document";

const schema = z.object({
  type_document: z.number().min(1, "Type de document requis"),
  famille: z.number().min(1, "Famille requise"),
  obligatoire: z.boolean(),
});

type FormData = z.infer<typeof schema>;

function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Sélectionner...",
  searchPlaceholder = "Rechercher...",
  emptyText = "Aucun résultat trouvé."
}: {
  value: number;
  onChange: (val: number) => void;
  options: { value: number; label: string }[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));
  const selectedLabel = options.find(o => o.value === value)?.label;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger 
        render={
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          />
        }
      >
        {selectedLabel || placeholder}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <div className="flex flex-col p-2 space-y-2">
          <Input 
            placeholder={searchPlaceholder} 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-9"
          />
          <div className="max-h-48 overflow-y-auto flex flex-col gap-1">
            {filtered.length === 0 ? (
              <p className="p-2 text-sm text-slate-500 text-center">{emptyText}</p>
            ) : (
              filtered.map(opt => (
                <div
                  key={opt.value}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-slate-100 hover:text-slate-900",
                    value === opt.value ? "bg-slate-100 font-medium" : ""
                  )}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === opt.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {opt.label}
                </div>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TypeDocumentFamilleDialog({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Queries
  const { data: typeDocs = [] } = useQuery({
    queryKey: ["type-documents"],
    queryFn: fetchTypeDocuments,
    enabled: open,
  });

  const { data: familles = [] } = useQuery({
    queryKey: ["familles"],
    queryFn: fetchFamilles,
    enabled: open,
  });

  const { data: relations = [], isLoading } = useQuery<TypeDocumentFamille[]>({
    queryKey: ["type-document-familles"],
    queryFn: fetchTypeDocumentFamilles,
    enabled: open,
  });

  // Filters for active types
  const activeTypeDocs = typeDocs.filter((td) => td.statut === "ACTIF");
  // Assuming 'actif' is a field or we just show all if no status exists. Let's assume familles can be archived if they have 'statut', otherwise we show all. 
  const activeFamilles = familles.filter((f: any) => f.statut === "ACTIVE");

  // Form setup
  const { control, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type_document: 0,
      famille: 0,
      obligatoire: false,
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createTypeDocumentFamille,
    onSuccess: () => {
      toast.success("Relation créée avec succès");
      queryClient.invalidateQueries({ queryKey: ["type-document-familles"] });
      resetForm();
    },
    onError: (error: any) => {
      if (error.response?.data?.non_field_errors) {
        toast.error(error.response.data.non_field_errors[0]);
      } else {
        toast.error("Erreur lors de la création");
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateTypeDocumentFamille,
    onSuccess: () => {
      toast.success("Relation modifiée avec succès");
      queryClient.invalidateQueries({ queryKey: ["type-document-familles"] });
      resetForm();
    },
    onError: (error: any) => {
      if (error.response?.data?.non_field_errors) {
        toast.error(error.response.data.non_field_errors[0]);
      } else {
        toast.error("Erreur lors de la modification");
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTypeDocumentFamille,
    onSuccess: () => {
      toast.success("Relation supprimée avec succès");
      queryClient.invalidateQueries({ queryKey: ["type-document-familles"] });
      setDeletingId(null);
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
      setDeletingId(null);
    },
  });

  const onSubmit = (data: FormData) => {
    // Client-side verification
    const relationExists = relations.find(
      (r) =>
        r.type_document === data.type_document &&
        r.famille === data.famille &&
        r.id_type_document_famille !== editingId
    );

    if (relationExists) {
      toast.error("Cette relation existe déjà.");
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (rel: TypeDocumentFamille) => {
    setEditingId(rel.id_type_document_famille);
    setValue("type_document", rel.type_document);
    setValue("famille", rel.famille);
    setValue("obligatoire", rel.obligatoire);
  };

  const handleDelete = (id: number) => {
    setDeletingId(id);
  };

  const confirmDelete = () => {
    if (deletingId) {
      deleteMutation.mutate(deletingId);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    reset({ type_document: 0, famille: 0, obligatoire: false });
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) resetForm();
      onOpenChange(val);
    }}>
      <DialogContent className="w-[95vw] sm:max-w-[90vw] md:max-w-[90vw] lg:max-w-6xl h-[90vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl">Gestion des relations Types de Document / Familles</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col lg:flex-row gap-6 mt-4 flex-1 min-h-0">
          {/* Form Side */}
          <div className="w-full lg:w-1/3 flex flex-col bg-slate-50 p-4 rounded-lg border border-slate-200 overflow-y-auto h-full max-h-[40vh] lg:max-h-none">
            <h3 className="font-semibold mb-4 text-slate-800">
              {editingId ? "Modifier la relation" : "Ajouter une relation"}
            </h3>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 flex-1">
              <div>
                <Label className="text-slate-700">Type de document</Label>
                <Controller
                  name="type_document"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={activeTypeDocs.map(td => ({ value: td.id_type_document, label: td.nom }))}
                      placeholder="Sélectionner un type..."
                      searchPlaceholder="Rechercher un type..."
                    />
                  )}
                />
                {errors.type_document && (
                  <p className="text-xs text-red-500 mt-1">{errors.type_document.message}</p>
                )}
              </div>

              <div>
                <Label className="text-slate-700">Famille</Label>
                <Controller
                  name="famille"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={activeFamilles.map((f: any) => ({ value: f.id_famille, label: f.nom || f.code }))}
                      placeholder="Sélectionner une famille..."
                      searchPlaceholder="Rechercher une famille..."
                    />
                  )}
                />
                {errors.famille && (
                  <p className="text-xs text-red-500 mt-1">{errors.famille.message}</p>
                )}
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Controller
                  name="obligatoire"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="checkbox"
                      id="obligatoire"
                      className="h-4 w-4 rounded border-gray-300 text-brand-green focus:ring-brand-green"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  )}
                />
                <Label htmlFor="obligatoire" className="text-sm cursor-pointer">
                  Document obligatoire pour cette famille
                </Label>
              </div>

              <div className="pt-4 flex gap-2">
                <Button 
                  type="submit" 
                  disabled={isSubmitting || createMutation.isPending || updateMutation.isPending} 
                  className="flex-1 bg-brand-green hover:bg-brand-green-hover text-white"
                >
                  {editingId ? "Enregistrer" : "Ajouter"}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Annuler
                  </Button>
                )}
              </div>
            </form>
          </div>

          {/* List Side */}
          <div className="w-full lg:w-2/3 flex flex-col border border-slate-200 rounded-lg overflow-hidden h-full">
            <div className="overflow-y-auto flex-1">
              <Table>
                <TableHeader className="bg-slate-50 sticky top-0">
                  <TableRow>
                    <TableHead>Type de document</TableHead>
                    <TableHead>Famille</TableHead>
                    <TableHead className="w-[100px] text-center">Obligatoire</TableHead>
                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                        Chargement...
                      </TableCell>
                    </TableRow>
                  ) : relations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                        Aucune relation trouvée.
                      </TableCell>
                    </TableRow>
                  ) : (
                    relations.map((rel) => (
                      <TableRow key={rel.id_type_document_famille} className={editingId === rel.id_type_document_famille ? "bg-slate-50" : ""}>
                        <TableCell className="font-medium">{rel.type_document_nom}</TableCell>
                        <TableCell>{rel.famille_nom}</TableCell>
                        <TableCell className="text-center">
                          {rel.obligatoire ? (
                            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Oui</Badge>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-brand-green"
                              onClick={() => handleEdit(rel)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-red-500"
                              onClick={() => handleDelete(rel.id_type_document_famille)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Overlay */}
        {deletingId && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
            <div className="bg-white p-6 rounded-lg shadow-lg border border-slate-200 max-w-sm text-center">
              <h4 className="text-lg font-semibold text-slate-900 mb-2">Confirmer la suppression</h4>
              <p className="text-sm text-slate-500 mb-6">
                Êtes-vous sûr de vouloir supprimer cette relation ? Cela ne supprimera ni le type de document, ni la famille, ni les documents existants.
              </p>
              <div className="flex justify-center gap-3">
                <Button variant="outline" onClick={() => setDeletingId(null)}>
                  Annuler
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={confirmDelete}
                  disabled={deleteMutation.isPending}
                >
                  Supprimer
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
