import React, { useState } from "react"; 
import { useQuery } from "@tanstack/react-query";
import { fetchAttributs } from "@/features/immobilisations/api/attributs";
import { AttributDynamique } from "@/features/immobilisations/types/attribut";
import { Edit2, Archive, Trash2, RotateCcw, Settings2, Plus, Search, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { AttributDialog } from "./AttributDialog";
import { AttributArchiveDialog } from "./AttributArchiveDialog";
import { AttributRestoreDialog } from "./AttributRestoreDialog";
import { AttributDeleteDialog } from "./AttributDeleteDialog";
import { AttributOptionsList } from "./AttributOptionsList";

interface FamilleAttributsListProps {
  familleId: number;
}

export function FamilleAttributsList({ familleId }: FamilleAttributsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAttribut, setSelectedAttribut] = useState<AttributDynamique | null>(null);
  const [expandedAttributId, setExpandedAttributId] = useState<number | null>(null);

  const { data: attributs, isLoading } = useQuery({
    queryKey: ["attributs"],
    queryFn: () => fetchAttributs(),
  });

  const familyAttributes = attributs?.filter((attr) => attr.famille === familleId) || [];
  
  const filteredAttributes = familyAttributes.filter((attr) => {
    const searchStr = `${attr.code} ${attr.libelle}`.toLowerCase();
    return searchStr.includes(searchQuery.toLowerCase());
  });

  const handleCreateClick = () => {
    setSelectedAttribut(null);
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

  const toggleExpand = (id: number) => {
    setExpandedAttributId(prev => (prev === id ? null : id));
  };

  return (
    <div className="space-y-4">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto ml-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher un attribut..."
                className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-brand-green"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={handleCreateClick} className="bg-brand-green hover:bg-brand-green-hover text-white shadow-sm">
              <Plus className="w-4 h-4 mr-2" />
              Créer un attribut
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500 animate-pulse">Chargement des attributs...</div>
          ) : filteredAttributes.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-700">Code</TableHead>
                    <TableHead className="font-semibold text-slate-700">Libellé</TableHead>
                    <TableHead className="font-semibold text-slate-700">Type</TableHead>
                    <TableHead className="font-semibold text-slate-700">Configuration</TableHead>
                    <TableHead className="font-semibold text-slate-700">Statut</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttributes.map((attr) => (
                    <React.Fragment key={attr.id_attribut}>
                      <TableRow 
                        className={`hover:bg-slate-50/50 transition-colors group ${expandedAttributId === attr.id_attribut ? 'bg-slate-50/50' : ''}`}
                        onClick={() => attr.type_donnee === "LISTE" ? toggleExpand(attr.id_attribut) : undefined}
                        style={{ cursor: attr.type_donnee === "LISTE" ? "pointer" : "default" }}
                      >
                        <TableCell className="font-mono text-xs text-slate-500">
                          {attr.type_donnee === "LISTE" && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 mr-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200"
                              onClick={(e) => { e.stopPropagation(); toggleExpand(attr.id_attribut); }}
                            >
                              {expandedAttributId === attr.id_attribut ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            </Button>
                          )}
                          <span className="bg-slate-50 px-2 py-1 rounded w-fit inline-block border border-slate-100">{attr.code}</span>
                        </TableCell>
                        <TableCell className="font-medium text-slate-900">
                        {attr.libelle}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
                          {attr.type_donnee}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {attr.obligatoire && (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 text-[10px]">Obligatoire</Badge>
                          )}
                          {attr.valeur_defaut && (
                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-[10px]">Défaut: {attr.valeur_defaut}</Badge>
                          )}
                          {attr.valeur_min !== null && (
                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-[10px]">Min: {attr.valeur_min}</Badge>
                          )}
                          {attr.valeur_max !== null && (
                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-[10px]">Max: {attr.valeur_max}</Badge>
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
                    {expandedAttributId === attr.id_attribut && attr.type_donnee === "LISTE" && (
                      <TableRow className="bg-slate-50/30 hover:bg-slate-50/30">
                        <TableCell colSpan={6} className="p-0 border-b-0">
                          <AttributOptionsList attributId={attr.id_attribut} />
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-8 text-center border-t border-slate-100">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 mb-4">
                <Settings2 className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-sm font-medium text-slate-900 mb-1">Aucun attribut trouvé</h3>
              <p className="text-sm text-slate-500 mb-4">
                {searchQuery ? "Aucun attribut ne correspond à votre recherche." : "Cette famille n'a pas encore d'attributs dynamiques."}
              </p>
              {!searchQuery && (
                <Button onClick={handleCreateClick} variant="outline" className="text-brand-green hover:text-brand-green">
                  <Plus className="w-4 h-4 mr-2" />
                  Créer le premier attribut
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AttributDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        attribut={selectedAttribut}
        defaultFamilleId={familleId}
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
