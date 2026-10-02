import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchOptions } from "@/features/immobilisations/api/attributs";
import { OptionAttribut } from "@/features/immobilisations/types/attribut";
import { Edit2, Archive, RotateCcw, Plus, Settings2, Trash2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Badge } from "@/shared/components/ui/badge";
import { OptionDialog } from "./OptionDialog";
import { OptionArchiveDialog } from "./OptionArchiveDialog";
import { OptionRestoreDialog } from "./OptionRestoreDialog";
import { OptionDeleteDialog } from "./OptionDeleteDialog";

interface AttributOptionsListProps {
  attributId: number;
}

export function AttributOptionsList({ attributId }: AttributOptionsListProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<OptionAttribut | null>(null);

  const { data: options, isLoading } = useQuery({
    queryKey: ["options", attributId],
    queryFn: () => fetchOptions(attributId),
  });

  const handleCreateClick = () => {
    setSelectedOption(null);
    setIsDialogOpen(true);
  };

  const handleEditClick = (opt: OptionAttribut) => {
    setSelectedOption(opt);
    setIsDialogOpen(true);
  };

  const handleArchiveClick = (opt: OptionAttribut) => {
    setSelectedOption(opt);
    setIsArchiveDialogOpen(true);
  };

  const handleRestoreClick = (opt: OptionAttribut) => {
    setSelectedOption(opt);
    setIsRestoreDialogOpen(true);
  };

  const handleDeleteClick = (opt: OptionAttribut) => {
    setSelectedOption(opt);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="bg-orange-50/30 p-4 border-t border-slate-100 rounded-b-xl border-x">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-orange-600" />
          Options de la liste
        </h4>
        <Button onClick={handleCreateClick} size="sm" className="bg-orange-600 hover:bg-orange-700 text-white h-8 text-xs shadow-sm">
          <Plus className="w-3.5 h-3.5 mr-1" />
          Nouvelle option
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-slate-500 py-4 text-center animate-pulse">Chargement des options...</div>
      ) : options && options.length > 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="w-[100px] text-xs font-medium text-slate-500">Ordre</TableHead>
                <TableHead className="text-xs font-medium text-slate-500">Code</TableHead>
                <TableHead className="text-xs font-medium text-slate-500">Libellé</TableHead>
                <TableHead className="text-xs font-medium text-slate-500">Statut</TableHead>
                <TableHead className="text-right text-xs font-medium text-slate-500">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {options.sort((a, b) => a.ordre - b.ordre).map((opt) => (
                <TableRow key={opt.id} className={opt.statut === "ARCHIVEE" ? "opacity-60 bg-slate-50/50" : ""}>
                  <TableCell className="font-medium text-slate-600 text-sm">
                    {opt.ordre}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded">
                      {opt.code}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium text-slate-700 text-sm">
                    {opt.libelle}
                  </TableCell>
                  <TableCell>
                    <Badge variant={opt.statut === "ACTIVE" ? "default" : "secondary"} className={
                      opt.statut === "ACTIVE" 
                        ? "bg-brand-green-light text-brand-green hover:bg-brand-green-light border-none" 
                        : "bg-slate-100 text-slate-600 hover:bg-slate-100 border-none"
                    }>
                      {opt.statut === "ACTIVE" ? "Active" : "Archivée"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                        onClick={() => handleEditClick(opt)}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      
                      {opt.statut === "ACTIVE" ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                          onClick={() => handleArchiveClick(opt)}
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => handleRestoreClick(opt)}
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteClick(opt)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
        <div className="text-sm text-slate-500 py-6 text-center bg-white border border-slate-200 rounded-lg">
          Aucune option définie pour cet attribut.
        </div>
      )}

      <OptionDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        attributId={attributId}
        option={selectedOption}
      />
      <OptionArchiveDialog
        isOpen={isArchiveDialogOpen}
        onClose={() => setIsArchiveDialogOpen(false)}
        attributId={attributId}
        option={selectedOption}
      />
      <OptionRestoreDialog
        isOpen={isRestoreDialogOpen}
        onClose={() => setIsRestoreDialogOpen(false)}
        attributId={attributId}
        option={selectedOption}
      />
      <OptionDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        attributId={attributId}
        option={selectedOption}
        totalOptions={options?.length || 0}
      />
    </div>
  );
}
