import { useState } from "react";
import { useGetMe } from "@workspace/api-client-react";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, FilterX, Calendar, Download } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

interface UnidadPedida {
  productoId: number | null;
  productoNombre: string;
  categoriaNombre: string;
  totalUnidades: number;
}

function useUnidadesPedidas(params: {
  fechaInicio?: string;
  fechaFin?: string;
  productoId?: string;
}) {
  const qs = new URLSearchParams();
  if (params.fechaInicio) qs.set("fechaInicio", params.fechaInicio);
  if (params.fechaFin) qs.set("fechaFin", params.fechaFin);
  if (params.productoId) qs.set("productoId", params.productoId);

  return useQuery<UnidadPedida[]>({
    queryKey: ["unidades-pedidas", params],
    queryFn: async () => {
      const r = await fetch(`/api/reportes/unidades-pedidas?${qs}`);
      if (!r.ok) throw new Error("Error cargando reporte");
      return r.json();
    },
    staleTime: 30_000,
  });
}

export default function UnidadesPedidas() {
  const { data: me } = useGetMe();
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const lastDay = today.toISOString().slice(0, 10);

  const [fechaInicio, setFechaInicio] = useState(firstDay);
  const [fechaFin, setFechaFin] = useState(lastDay);
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading, refetch } = useUnidadesPedidas({ fechaInicio, fechaFin });

  const filtered = (data ?? []).filter(r =>
    !searchTerm ||
    r.productoNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.categoriaNombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalUnidades = filtered.reduce((s, r) => s + r.totalUnidades, 0);

  const clearFilters = () => {
    setSearchTerm("");
    setFechaInicio(firstDay);
    setFechaFin(lastDay);
  };

  const exportCsv = () => {
    const rows = [
      ["Producto", "Categoría", "Unidades Pedidas"],
      ...filtered.map(r => [r.productoNombre, r.categoriaNombre, String(r.totalUnidades)]),
      ["TOTAL", "", String(totalUnidades)],
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `unidades-pedidas-${fechaInicio}-${fechaFin}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Unidades Pedidas</h2>
          <p className="text-muted-foreground">
            Reporte de unidades pedidas por producto en el período seleccionado.
          </p>
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={filtered.length === 0}>
          <Download className="mr-2 h-4 w-4" /> Exportar CSV
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar producto o categoría..." className="pl-9"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input type="date" className="pl-9" value={fechaInicio}
            onChange={e => { setFechaInicio(e.target.value); }} />
        </div>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input type="date" className="pl-9" value={fechaFin}
            onChange={e => { setFechaFin(e.target.value); }} />
        </div>
        <Button onClick={() => refetch()}>Aplicar</Button>
        {(searchTerm || fechaInicio !== firstDay || fechaFin !== lastDay) && (
          <Button variant="ghost" onClick={clearFilters}>
            <FilterX className="mr-2 h-4 w-4" /> Limpiar
          </Button>
        )}
      </div>

      {filtered.length > 0 && (
        <div className="flex gap-4">
          <div className="bg-card border rounded-lg px-5 py-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total unidades</p>
            <p className="text-2xl font-bold">{totalUnidades.toLocaleString("es-CR")}</p>
          </div>
          <div className="bg-card border rounded-lg px-5 py-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Productos distintos</p>
            <p className="text-2xl font-bold">{filtered.length}</p>
          </div>
        </div>
      )}

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-right">Unidades pedidas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No hay datos para el período seleccionado.
                </TableCell>
              </TableRow>
            ) : (
              filtered
                .sort((a, b) => b.totalUnidades - a.totalUnidades)
                .map((r, i) => (
                  <TableRow key={r.productoId ?? i}>
                    <TableCell className="text-muted-foreground text-sm">{i + 1}</TableCell>
                    <TableCell className="font-medium">{r.productoNombre}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{r.categoriaNombre}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-lg">
                      {r.totalUnidades.toLocaleString("es-CR")}
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>

      {!isLoading && data && (
        <p className="text-xs text-muted-foreground text-center">
          Período: {fechaInicio} al {fechaFin}
        </p>
      )}
    </div>
  );
}
