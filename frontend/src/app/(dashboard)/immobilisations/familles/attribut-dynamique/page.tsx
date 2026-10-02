"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { fetchAttributs } from "@/features/immobilisations/api/attributs";
import { fetchFamilles } from "@/features/immobilisations/api/familles";
import { AttributDynamique, TypeDonnee } from "@/features/immobilisations/types/attribut";
import { Plus, Edit2, Trash2, Settings2, Search, ChevronLeft, ChevronRight, RotateCcw, Archive } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { AttributDialog } from "@/features/immobilisations/components/AttributDialog";
import { AttributArchiveDialog } from "@/features/immobilisations/components/AttributArchiveDialog";
import { AttributRestoreDialog } from "@/features/immobilisations/components/AttributRestoreDialog";
import { AttributDeleteDialog } from "@/features/immobilisations/components/AttributDeleteDialog";
import { EmptyState } from "@/shared/components/EmptyState";
import { ErrorMessage } from "@/shared/components/ErrorMessage";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

export default function AttributsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "ARCHIVEE">("ALL");
  const [familleFilter, setFamilleFilter] = useState<string>("ALL");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAttribut, setSelectedAttribut] = useState<AttributDynamique | null>(null);
  const [defaultFamilleId, setDefaultFamilleId] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const action = params.get("action");
      const familleId = params.get("familleId");
      if (action === "create" && familleId) {
        setDefaultFamilleId(parseInt(familleId, 10));
        setFamilleFilter(familleId);
        setIsDialogOpen(true);
        // Clear the URL so it doesn't reopen on refresh
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, []);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const { data: attributs, isLoading, isError, refetch } = useQuery({
    queryKey: ["attributs"],
    queryFn: () => fetchAttributs(),
  });

  const { data: familles } = useQuery({
    queryKey: ["familles"],
    queryFn: fetchFamilles,
  });

  const filteredAttributs = attributs?.filter((attr) => {
    const searchStr = `${attr.code} ${attr.libelle}`.toLowerCase();
    const matchesSearch = searchStr.includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || attr.statut === statusFilter;
    const matchesFamille = familleFilter === "ALL" || attr.famille.toString() === familleFilter;
    return matchesSearch && matchesStatus && matchesFamille;
  }) || [];

  const totalPages = Math.ceil(filteredAttributs.length / itemsPerPage);

  const currentAttributs = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAttributs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAttributs, currentPage, itemsPerPage]);

  const activeCount = attributs?.filter((f) => f.statut === "ACTIVE").length || 0;

  const handleCreateClick = () => {
    setSelectedAttribut(null);
    setDefaultFamilleId(undefined);
    setIsDialogOpen(true);
  };

  const handleEditClick = (attr: AttributDynamique) => {
    setSelectedAttribut(attr);
    setIsDialogOpen(true);
  };

  const handleArchiveClick = (attr: AttributDynamique) => {
    setSelectedAttribut(attr);
    setIsArchiveDialogOpen(true);
  };

  const handleRestoreClick = (attr: AttributDynamique) => {
    setSelectedAttribut(attr);
    setIsRestoreDialogOpen(true);
  };

  const handleDeleteClick = (attr: AttributDynamique) => {
    setSelectedAttribut(attr);
    setIsDeleteDialogOpen(true);
  };

  const getFamilleName = (familleId: number) => {
    return familles?.find(f => f.id_famille === familleId)?.nom || `Famille #${familleId}`;
  };

  const getTypeLabel = (type: TypeDonnee) => {
    const mapping: Record<TypeDonnee, string> = {
      [TypeDonnee.TEXTE]: "Texte",
      [TypeDonnee.NOMBRE]: "Nombre Entier",
      [TypeDonnee.DECIMAL]: "Décimal",
      [TypeDonnee.DATE]: "Date",
      [TypeDonnee.BOOLEEN]: "Booléen",
      [TypeDonnee.LISTE]: "Liste",
    };
    return mapping[type] || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/immobilisations/familles")}
            className="rounded-full bg-white shadow-sm border border-slate-200 hover:bg-slate-50 h-10 w-10 shrink-0"
          >
            <ChevronLeft className="h-5 w-5 text-slate-600" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Attributs dynamiques</h1>
            <p className="text-slate-500 mt-1">
              Configurez les champs personnalisés pour chaque famille d'immobilisation.
            </p>
          </div>
        </div>
        <Button onClick={handleCreateClick} className="bg-brand-green hover:bg-brand-green-hover text-white shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          Créer un attribut
        </Button>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-brand-green" />
              Liste des attributs
            </CardTitle>
            <CardDescription>
              {activeCount} attribut(s) actif(s) configuré(s).
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Select value={familleFilter} onValueChange={(v) => { setFamilleFilter(v as string); setCurrentPage(1); }}>
              <SelectTrigger className="w-full sm:w-[220px] bg-white">
                <span className="text-slate-500 mr-1">Famille:</span>
                <span className="truncate font-medium text-slate-700">
                  {familleFilter === "ALL" ? "Toutes" : familles?.find(f => f.id_famille.toString() === familleFilter)?.nom}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Toutes</SelectItem>
                {familles?.map(f => (
                  <SelectItem key={f.id_famille} value={f.id_famille.toString()}>{f.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as "ALL" | "ACTIVE" | "ARCHIVEE"); setCurrentPage(1); }}>
              <SelectTrigger className="w-full sm:w-[200px] bg-white">
                <span className="text-slate-500 mr-1">Statut:</span>
                <span className="truncate font-medium text-slate-700">
                  {statusFilter === "ALL" ? "Tous" : statusFilter === "ACTIVE" ? "Actifs" : "Archivés"}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous</SelectItem>
                <SelectItem value="ACTIVE">Actifs</SelectItem>
                <SelectItem value="ARCHIVEE">Archivés</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher un attribut..."
                className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-brand-green"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500 animate-pulse">Chargement des attributs...</div>
          ) : isError ? (
            <div className="p-6 flex flex-col items-center gap-4">
              <ErrorMessage
                title="Erreur de chargement"
                message="Impossible de charger les attributs. Veuillez réessayer."
              />
              <Button onClick={() => refetch()} variant="outline">Réessayer</Button>
            </div>
          ) : filteredAttributs && filteredAttributs.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-700">Famille</TableHead>
                    <TableHead className="font-semibold text-slate-700">Code</TableHead>
                    <TableHead className="font-semibold text-slate-700">Libellé</TableHead>
                    <TableHead className="font-semibold text-slate-700">Type</TableHead>
                    <TableHead className="font-semibold text-slate-700">Configuration</TableHead>
                    <TableHead className="font-semibold text-slate-700">Statut</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentAttributs.map((attr) => (
                    <TableRow 
                      key={attr.id_attribut} 
                      className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                      onClick={() => router.push(`/immobilisations/familles/attribut-dynamique/${attr.id_attribut}`)}
                    >
                      <TableCell className="font-medium text-slate-600">
                        {getFamilleName(attr.famille)}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded w-fit inline-block mt-3">
                        {attr.code}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">
                        {attr.libelle}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {getTypeLabel(attr.type_donnee)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {attr.obligatoire && (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-[10px]">Obligatoire</Badge>
                          )}
                          {attr.valeur_min !== null && (
                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-[10px]">Min: {attr.valeur_min}</Badge>
                          )}
                          {attr.valeur_max !== null && (
                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-[10px]">Max: {attr.valeur_max}</Badge>
                          )}
                          {attr.longueur_min !== null && (
                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-[10px]">LenMin: {attr.longueur_min}</Badge>
                          )}
                          {attr.longueur_max !== null && (
                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-[10px]">LenMax: {attr.longueur_max}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={attr.statut === "ACTIVE" ? "bg-brand-green-light text-brand-green border-brand-green/20" : "bg-slate-100 text-slate-600 border-slate-300"}>
                          {attr.statut === "ACTIVE" ? "Actif" : "Archivé"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {attr.statut === "ACTIVE" ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                onClick={(e) => { e.stopPropagation(); handleEditClick(attr); }}
                                title="Modifier cet attribut"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                onClick={(e) => { e.stopPropagation(); handleArchiveClick(attr); }}
                                title="Archiver cet attribut"
                              >
                                <Archive className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-brand-green hover:bg-brand-green-light"
                                onClick={(e) => { e.stopPropagation(); handleRestoreClick(attr); }}
                                title="Restaurer cet attribut"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                onClick={(e) => { e.stopPropagation(); handleDeleteClick(attr); }}
                                title="Supprimer définitivement cet attribut"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-12">
              <EmptyState
                icon={Settings2}
                title="Aucun attribut trouvé"
                description={searchQuery || familleFilter !== "ALL" ? "Aucun attribut ne correspond à vos filtres de recherche." : "Vous n'avez pas encore créé d'attribut dynamique pour vos familles. Commencez par en configurer un !"}
                actionLabel={searchQuery || familleFilter !== "ALL" ? "Effacer les filtres" : "Créer un attribut"}
                onAction={() => {
                  setSearchQuery("");
                  setFamilleFilter("ALL");
                  setStatusFilter("ALL");
                  if (!searchQuery && familleFilter === "ALL") handleCreateClick();
                }}
              />
            </div>
          )}
        </CardContent>
        {/* Compact Pagination Footer */}
        {filteredAttributs && filteredAttributs.length > 0 && (
          <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-end gap-6 text-sm text-slate-500 rounded-b-lg">
            <div className="flex items-center gap-2">
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(val) => {
                  setItemsPerPage(Number(val));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-fit border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 focus:ring-0">
                  <SelectValue placeholder={`${itemsPerPage} per page`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="25">25 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                  <SelectItem value="100">100 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="font-medium text-slate-700">
              {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredAttributs.length)} of {filteredAttributs.length}
            </div>
            <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5 shadow-sm">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-7 w-7 text-slate-500 hover:text-slate-900 rounded-md"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-7 w-7 text-slate-500 hover:text-slate-900 rounded-md"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <AttributDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        attribut={selectedAttribut}
        defaultFamilleId={defaultFamilleId}
      />

      <AttributArchiveDialog
        isOpen={isArchiveDialogOpen}
        onClose={() => setIsArchiveDialogOpen(false)}
        attribut={selectedAttribut}
      />

      <AttributRestoreDialog
        isOpen={isRestoreDialogOpen}
        onClose={() => setIsRestoreDialogOpen(false)}
        attribut={selectedAttribut}
      />

      <AttributDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        attribut={selectedAttribut}
      />
    </div>
  );
}
