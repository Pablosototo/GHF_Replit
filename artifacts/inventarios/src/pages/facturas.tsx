import { useState } from "react";
import { Link } from "wouter";
import { 
  useListFacturas, useGetFactura, useListLocales, useGetMe
} from "@workspace/api-client-react";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, Receipt, Printer, Eye, FilePlus2, Search, FilterX, Calendar
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

const EMPRESA_NOMBRE = "Grupo Hung Fung";
const EMPRESA_DIRECCION = "San José, Costa Rica";
const EMPRESA_TELEFONO = "Tel: (506) 2000-0000";

function printFactura(factura: any) {
  const detalles = (factura.detalles ?? []);

  // Group by tax rate for breakdown
  const taxGroups: Record<number, { base: number; impuesto: number }> = {};
  for (const d of detalles) {
    const pct = d.impuestoPct ?? 13;
    if (!taxGroups[pct]) taxGroups[pct] = { base: 0, impuesto: 0 };
    taxGroups[pct].base += d.subtotal ?? 0;
    taxGroups[pct].impuesto += d.impuesto ?? 0;
  }

  const fmt = (n: number) => "₡" + n.toLocaleString("es-CR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtDate = (s: string) => {
    const d = new Date(s);
    return d.toLocaleDateString("es-CR", { day: "2-digit", month: "2-digit", year: "numeric" }) +
      " " + d.toLocaleTimeString("es-CR", { hour: "2-digit", minute: "2-digit" });
  };

  const taxRows = Object.entries(taxGroups)
    .map(([pct, v]) => `<tr>
      <td colspan="3" style="text-align:right;padding:2px 8px;color:#555">Impuesto ${pct}% sobre ${fmt(v.base)}</td>
      <td style="text-align:right;padding:2px 8px;color:#555">${fmt(v.impuesto)}</td>
    </tr>`).join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Factura ${factura.numeroFactura}</title>
  <style>
    body{font-family:Arial,sans-serif;font-size:12px;margin:0;padding:24px;color:#111}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px}
    .empresa{font-size:18px;font-weight:900;letter-spacing:-0.5px}
    .empresa-sub{font-size:11px;color:#555;margin-top:4px}
    .factura-num{font-size:22px;font-weight:800;font-family:monospace}
    table{width:100%;border-collapse:collapse;margin:16px 0}
    th{background:#1e293b;color:#fff;padding:6px 8px;text-align:left;font-size:11px}
    td{padding:5px 8px;border-bottom:1px solid #eee}
    .total-row td{font-weight:900;font-size:14px;border-top:2px solid #111}
    .footer{text-align:center;margin-top:32px;font-size:10px;color:#888;letter-spacing:1px;text-transform:uppercase}
    @media print{body{padding:0}}
  </style></head><body>
  <div class="header">
    <div>
      <div class="empresa">${EMPRESA_NOMBRE}</div>
      <div class="empresa-sub">${EMPRESA_DIRECCION}</div>
      <div class="empresa-sub">${EMPRESA_TELEFONO}</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:11px;color:#555;text-transform:uppercase;letter-spacing:1px">Factura</div>
      <div class="factura-num">${factura.numeroFactura}</div>
      <div style="margin-top:8px;font-size:11px">
        <strong>Local:</strong> ${factura.localNombre || "-"}<br>
        <strong>Fecha:</strong> ${fmtDate(factura.fecha)}<br>
        <strong>Estado:</strong> ${factura.estado}
      </div>
    </div>
  </div>
  ${factura.clienteNombre ? `<div style="margin-bottom:12px;padding:8px 12px;background:#f8fafc;border-radius:4px;font-size:11px">
    <strong>Cliente:</strong> ${factura.clienteNombre}
    ${factura.clienteTelefono ? `&nbsp;·&nbsp; Tel: ${factura.clienteTelefono}` : ""}
    ${factura.clienteEmail ? `&nbsp;·&nbsp; ${factura.clienteEmail}` : ""}
  </div>` : ""}
  <table>
    <thead><tr>
      <th>Descripción</th>
      <th style="text-align:center;width:60px">Cant.</th>
      <th style="text-align:right;width:120px">Precio Unit.</th>
      <th style="text-align:right;width:120px">Subtotal</th>
    </tr></thead>
    <tbody>
      ${detalles.map((d: any) => `<tr>
        <td>${d.descripcion}</td>
        <td style="text-align:center">${d.cantidad}</td>
        <td style="text-align:right">${fmt(d.precioUnitario)}</td>
        <td style="text-align:right">${fmt(d.subtotal)}</td>
      </tr>`).join("")}
      <tr><td colspan="4" style="padding:4px 0"></td></tr>
      <tr>
        <td colspan="3" style="text-align:right;font-weight:600;padding:4px 8px">Subtotal</td>
        <td style="text-align:right;padding:4px 8px">${fmt(factura.subtotal)}</td>
      </tr>
      ${taxRows}
    </tbody>
    <tfoot>
      <tr class="total-row">
        <td colspan="3" style="text-align:right;padding:8px">TOTAL</td>
        <td style="text-align:right;padding:8px">${fmt(factura.total)}</td>
      </tr>
    </tfoot>
  </table>
  ${factura.observaciones ? `<div style="background:#f8fafc;padding:8px 12px;border-radius:4px;font-size:11px;font-style:italic">${factura.observaciones}</div>` : ""}
  <div class="footer">¡Gracias por su compra! — ${EMPRESA_NOMBRE}</div>
  <script>window.onload=()=>{window.print();}</script>
  </body></html>`;

  const w = window.open("", "_blank", "width=800,height=600");
  if (w) { w.document.write(html); w.document.close(); }
}

export default function Facturas() {
  const { data: me } = useGetMe();
  const isAdmin = me?.role === "admin";
  
  const [estadoFilter, setEstadoFilter] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [localFilter, setLocalFilter] = useState("all");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [selectedFacturaId, setSelectedFacturaId] = useState<number | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { data: facturas, isLoading } = useListFacturas({
    estado: estadoFilter === "todos" ? undefined : estadoFilter,
    localId: isAdmin ? (localFilter !== "all" ? Number(localFilter) : undefined) : (me?.localId || undefined),
  } as any);
  
  const { data: detailFactura, isLoading: isDetailLoading } = useGetFactura(selectedFacturaId || 0);
  const { data: locales } = useListLocales();

  const filteredFacturas = (facturas ?? []).filter(f => {
    const term = searchTerm.toLowerCase();
    const matchText = !term ||
      (f.numeroFactura || "").toLowerCase().includes(term) ||
      ((f as any).localNombre || "").toLowerCase().includes(term) ||
      (f.clienteNombre || "").toLowerCase().includes(term);
    const fDate = new Date(f.fecha);
    const matchFechaI = !fechaInicio || fDate >= new Date(fechaInicio);
    const matchFechaF = !fechaFin || fDate <= new Date(fechaFin + "T23:59:59");
    return matchText && matchFechaI && matchFechaF;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setLocalFilter("all");
    setFechaInicio("");
    setFechaFin("");
  };
  const hasFilters = searchTerm || localFilter !== "all" || fechaInicio || fechaFin;

  const handleOpenDetail = (id: number) => {
    setSelectedFacturaId(id);
    setIsDetailOpen(true);
  };

  // Compute tax breakdown for detail view
  const taxGroups: Record<number, { base: number; impuesto: number }> = {};
  if (detailFactura) {
    for (const d of (detailFactura.detalles ?? [])) {
      const pct = (d as any).impuestoPct ?? 13;
      if (!taxGroups[pct]) taxGroups[pct] = { base: 0, impuesto: 0 };
      taxGroups[pct].base += d.subtotal ?? 0;
      taxGroups[pct].impuesto += (d as any).impuesto ?? 0;
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Facturas</h2>
          <p className="text-muted-foreground">Historial de facturación y comprobantes.</p>
        </div>
        {isAdmin && (
          <Link href="/facturas/nueva">
            <Button><FilePlus2 className="mr-2 h-4 w-4" />Nueva factura</Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="N° factura, local, cliente..." className="pl-9" value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        {isAdmin && (
          <Select value={localFilter} onValueChange={setLocalFilter}>
            <SelectTrigger><SelectValue placeholder="Todos los locales" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los locales</SelectItem>
              {locales?.map(l => <SelectItem key={l.id} value={l.id.toString()}>{l.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input type="date" className="pl-9" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)}
            placeholder="Desde" />
        </div>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input type="date" className="pl-9" value={fechaFin} onChange={e => setFechaFin(e.target.value)}
            placeholder="Hasta" />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          {["todos", "emitida", "anulada"].map(estado => (
            <Button key={estado} size="sm" variant={estadoFilter === estado ? "default" : "outline"}
              onClick={() => setEstadoFilter(estado)}>
              {estado === "todos" ? "Todas" : estado.charAt(0).toUpperCase() + estado.slice(1)}
            </Button>
          ))}
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <FilterX className="mr-2 h-4 w-4" /> Limpiar filtros
          </Button>
        )}
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Cliente</TableHead>
              {isAdmin && <TableHead>Local</TableHead>}
              <TableHead className="text-right">Subtotal</TableHead>
              <TableHead className="text-right">Impuesto</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-center">Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFacturas.map((factura) => (
              <TableRow key={factura.id} className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleOpenDetail(factura.id)}>
                <TableCell className="font-mono font-bold">{factura.numeroFactura}</TableCell>
                <TableCell className="text-xs">{formatDateTime(factura.fecha)}</TableCell>
                <TableCell className="font-medium">{factura.clienteNombre || "-"}</TableCell>
                {isAdmin && <TableCell>{(factura as any).localNombre || "-"}</TableCell>}
                <TableCell className="text-right">{formatCurrency(factura.subtotal)}</TableCell>
                <TableCell className="text-right text-muted-foreground">{formatCurrency(factura.impuesto)}</TableCell>
                <TableCell className="text-right font-bold">{formatCurrency(factura.total)}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className={cn(
                    "capitalize",
                    factura.estado === "emitida" || factura.estado === "valida"
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-red-50 text-red-700 border-red-200"
                  )}>
                    {factura.estado}
                  </Badge>
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDetail(factura.id)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Imprimir" onClick={async () => {
                      const r = await fetch(`/api/facturas/${factura.id}`);
                      printFactura(await r.json());
                    }}>
                      <Printer className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredFacturas.length === 0 && (
              <TableRow>
                <TableCell colSpan={isAdmin ? 9 : 8} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <Receipt className="h-8 w-8 text-muted-foreground/30" />
                    <span>No hay facturas registradas.</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de Factura</DialogTitle>
          </DialogHeader>

          {isDetailLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : detailFactura ? (
            <div className="space-y-6 py-2">
              {/* Header */}
              <div className="flex justify-between items-start bg-slate-900 text-white rounded-lg p-5">
                <div>
                  <h1 className="text-xl font-black tracking-tight uppercase">{EMPRESA_NOMBRE}</h1>
                  <p className="text-sm text-slate-300">{EMPRESA_DIRECCION}</p>
                  <p className="text-sm text-slate-300">{EMPRESA_TELEFONO}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-widest text-slate-400">Factura</p>
                  <p className="text-xl font-mono font-bold">{detailFactura.numeroFactura}</p>
                  <p className="text-sm text-slate-300">{(detailFactura as any).localNombre || "-"}</p>
                  <p className="text-xs text-slate-400">{formatDateTime(detailFactura.fecha)}</p>
                </div>
              </div>

              {detailFactura.clienteNombre && (
                <div className="bg-muted/40 rounded-lg p-4 text-sm">
                  <p className="font-semibold text-xs text-muted-foreground uppercase tracking-widest mb-1">Cliente</p>
                  <p className="font-bold">{detailFactura.clienteNombre}</p>
                  {detailFactura.clienteTelefono && <p className="text-muted-foreground">{detailFactura.clienteTelefono}</p>}
                  {detailFactura.clienteEmail && <p className="text-muted-foreground">{detailFactura.clienteEmail}</p>}
                </div>
              )}

              <Separator />

              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-center w-16">Cant.</TableHead>
                    <TableHead className="text-right w-28">Precio Unit.</TableHead>
                    <TableHead className="text-right w-28">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(detailFactura.detalles ?? []).map((det: any) => (
                    <TableRow key={det.id}>
                      <TableCell>{det.descripcion}</TableCell>
                      <TableCell className="text-center">{det.cantidad}</TableCell>
                      <TableCell className="text-right">{formatCurrency(det.precioUnitario)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(det.subtotal)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex justify-end">
                <div className="w-72 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{formatCurrency(detailFactura.subtotal)}</span>
                  </div>
                  {Object.entries(taxGroups).map(([pct, v]) => (
                    <div key={pct} className="flex justify-between text-muted-foreground">
                      <span>Impuesto {pct}%</span>
                      <span>{formatCurrency(v.impuesto)}</span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between font-black text-lg">
                    <span>Total</span>
                    <span>{formatCurrency(detailFactura.total)}</span>
                  </div>
                </div>
              </div>

              {detailFactura.observaciones && (
                <div className="bg-muted/30 p-3 rounded text-sm italic text-muted-foreground">
                  {detailFactura.observaciones}
                </div>
              )}
            </div>
          ) : null}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Cerrar</Button>
            {detailFactura && (
              <Button onClick={() => printFactura(detailFactura)}>
                <Printer className="h-4 w-4 mr-2" /> Imprimir
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
