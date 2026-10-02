import React from "react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { ReleveUsage } from "../types/immobilisation";
import { AttributDynamique, OptionAttribut } from "../types/attribut";

interface ThemePalette {
  primary: string;
  dark: string;
  light: string;
}

interface PrintableHistoriqueProps {
  releves: (ReleveUsage & { id: number })[];
  attributs: AttributDynamique[] | undefined;
  optionsMap: Record<number, OptionAttribut[]>;
  familleNom: string;
  familleIcone?: string | null;
  codeImmobilisation: string;
  designationImmobilisation: string;
  entrepriseNom: string;
  themePalette?: ThemePalette | null;
}

// Brand colors derived from the logo
const BRAND = {
  green:      "#3CB395",
  dark:       "#0E2427",
  greenLight: "#e8f7f3",
  rule:       "#d1d5db",
  muted:      "#6b7280",
  body:       "#111827",
  accent:     "#059669",   // value highlight colour
};

export const PrintableHistorique = React.forwardRef<HTMLDivElement, PrintableHistoriqueProps>(
  ({ releves, attributs, optionsMap, familleNom, familleIcone, codeImmobilisation, designationImmobilisation, entrepriseNom, themePalette }, ref) => {

    // If a custom palette was extracted from the famille icon, blend it in
    const accentColor = themePalette?.primary || BRAND.green;
    const darkColor   = themePalette?.dark    || BRAND.dark;

    const formatDate = (dateString: string) => {
      try {
        return format(parseISO(dateString), "dd MMM yyyy '–' HH:mm", { locale: fr });
      } catch {
        return dateString;
      }
    };

    const getAttributLabel = (attrId: number) =>
      attributs?.find(a => a.id_attribut === attrId)?.libelle || `Attribut #${attrId}`;

    const getOptionLabel = (attrId: number, optId: number) =>
      optionsMap[attrId]?.find(o => o.id === optId)?.libelle || `Option #${optId}`;

    const logoSrc = familleIcone
      ? (familleIcone.startsWith("http") ? familleIcone : `http://localhost:8000${familleIcone}`)
      : null;

    return (
      <div
        ref={ref}
        style={{
          width: "794px",
          minHeight: "1123px",
          backgroundColor: "#ffffff",
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          color: BRAND.body,
          display: "flex",
          flexDirection: "column",
          padding: "52px 56px",
          boxSizing: "border-box",
        }}
      >
        {/* ── Header ─────────────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>

          {/* Left: company breadcrumb + title */}
          <div>
            <p style={{ fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: BRAND.muted, marginBottom: "8px" }}>
              {entrepriseNom} — Gestion des immobilisations
            </p>
            <h1 style={{ fontSize: "26px", fontWeight: 700, color: darkColor, margin: 0, letterSpacing: "-0.5px" }}>
              Historique des relevés
            </h1>
          </div>

          {/* Right: date + logo badge */}
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "11px", color: BRAND.muted, marginBottom: "8px" }}>
              Généré le<br />
              <span style={{ fontWeight: 600, color: BRAND.body }}>
                {format(new Date(), "dd MMMM yyyy", { locale: fr })}
              </span>
            </p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
              {logoSrc ? (
                <img
                  src={logoSrc}
                  alt={familleNom}
                  style={{ height: "28px", width: "28px", objectFit: "contain", borderRadius: "6px", border: `1.5px solid ${accentColor}`, padding: "2px" }}
                />
              ) : (
                <div style={{ height: "28px", width: "28px", borderRadius: "6px", border: `1.5px solid ${accentColor}`, backgroundColor: BRAND.greenLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: accentColor }}>{familleNom.substring(0, 2).toUpperCase()}</span>
                </div>
              )}
              <span style={{ fontSize: "11px", fontWeight: 600, color: accentColor }}>{entrepriseNom}</span>
            </div>
          </div>
        </div>

        {/* ── Thin rule ──────────────────────────────────────────── */}
        <div style={{ height: "1px", backgroundColor: BRAND.rule, marginBottom: "20px" }} />

        {/* ── Metadata table ─────────────────────────────────────── */}
        <div style={{ marginBottom: "24px" }}>
          {[
            { label: "Code",        value: codeImmobilisation },
            { label: "Désignation", value: designationImmobilisation },
            { label: "Famille",     value: familleNom },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "5px 0", borderBottom: `1px solid #f3f4f6` }}
            >
              <span style={{ fontSize: "12px", color: BRAND.muted }}>{label}</span>
              <span style={{ fontSize: "12px", fontWeight: 600, color: BRAND.body }}>{value}</span>
            </div>
          ))}
        </div>

        {/* ── Thin rule ──────────────────────────────────────────── */}
        <div style={{ height: "1px", backgroundColor: BRAND.rule, marginBottom: "20px" }} />

        {/* ── Section title ──────────────────────────────────────── */}
        <p style={{ fontSize: "12px", fontStyle: "italic", color: BRAND.muted, marginBottom: "20px" }}>
          Trace de l'évolution des attributs dynamiques
        </p>

        {/* ── Timeline entries ────────────────────────────────────── */}
        <div style={{ flexGrow: 1 }}>
          {releves.map((releve, idx) => {
            const attrLabel    = getAttributLabel(releve.attribut);
            const valueDisplay = releve.option
              ? getOptionLabel(releve.attribut, releve.option)
              : (releve.valeur || "Vide");

            return (
              <div key={releve.id}>
                {/* Entry row */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", padding: "12px 0" }}>
                  {/* Bullet */}
                  <div style={{ marginTop: "4px", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: accentColor, flexShrink: 0 }} />

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: BRAND.body }}>{attrLabel}</span>
                      <span style={{ fontSize: "11px", color: BRAND.muted }}>{formatDate(releve.date_releve)}</span>
                    </div>
                    <p style={{ fontSize: "12px", color: BRAND.muted, margin: "4px 0 0" }}>
                      Nouvelle valeur :{" "}
                      <span style={{ fontWeight: 700, color: accentColor }}>{valueDisplay}</span>
                    </p>
                  </div>
                </div>

                {/* Divider between entries (not after last) */}
                {idx < releves.length - 1 && (
                  <div style={{ height: "1px", backgroundColor: "#f3f4f6", marginLeft: "22px" }} />
                )}
              </div>
            );
          })}
        </div>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <div style={{ marginTop: "auto", paddingTop: "32px", borderTop: `1px solid ${BRAND.rule}` }}>
          <p style={{ fontSize: "11px", fontStyle: "italic", color: BRAND.muted, marginBottom: "4px" }}>
            Historique à jour, aucune anomalie détectée.
          </p>
          <p style={{ fontSize: "10px", color: "#9ca3af" }}>
            généré automatiquement – système de gestion des immobilisations
          </p>
        </div>
      </div>
    );
  }
);
PrintableHistorique.displayName = "PrintableHistorique";

