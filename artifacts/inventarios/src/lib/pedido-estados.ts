export const ESTADOS_GESTIONABLES = [
  "pendiente",
  "procesando",
  "enviando",
  "anulada",
] as const;

export type EstadoGestionable = (typeof ESTADOS_GESTIONABLES)[number];

export const ESTADO_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  procesando: "Procesando",
  enviando: "Enviando",
  facturado: "Facturado",
  anulada: "Anulada",
  anulado: "Anulada",
  emitida: "Emitida",
};

export const ESTADO_BADGE_CLASSES: Record<string, string> = {
  pendiente: "bg-yellow-50 text-yellow-700 border-yellow-200",
  procesando: "bg-blue-50 text-blue-700 border-blue-200",
  enviando: "bg-indigo-50 text-indigo-700 border-indigo-200",
  facturado: "bg-green-50 text-green-700 border-green-200",
  anulada: "bg-red-50 text-red-700 border-red-200",
  anulado: "bg-red-50 text-red-700 border-red-200",
  emitida: "bg-green-50 text-green-700 border-green-200",
};
