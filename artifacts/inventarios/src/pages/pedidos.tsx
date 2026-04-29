import { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListPedidos, 
  useCreatePedido,
  useAnularPedido,
  useFacturarPedido,
  useGetPedido,
  useListPedidoEventos,
  useCambiarEstadoPedido,
  useListProductos,
  useListLocales,
  useGetMe,
  getListPedidosQueryKey,
  getGetPedidoQueryKey
} from "@workspace/api-client-react";
import { ESTADOS_GESTIONABLES, ESTADO_LABELS, ESTADO_BADGE_CLASSES } from "@/lib/pedido-estados";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ChevronsUpDown, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Plus, 
  ShoppingCart,
  Receipt,
  Ban,
  Trash2,
  Package,
  Eye,
  Search,
  FilterX,
  Printer,
  Copy,
  Calendar
} from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { formatCurrency, formatDateTime, cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";

function ProductoCombobox({
  value,
  onChange,
  productos,
}: {
  value: number | string;
  onChange: (val: number) => void;
  productos: Array<{ id: number; nombre: string; sku?: string | null; categoriaNombre?: string | null; categoriaId?: number | null }>;
}) {
  const [open, setOpen] = useState(false);
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const selected = productos.find(p => p.id === Number(value));

  // Derive unique categories from products
  const categorias = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of productos) {
      if (p.categoriaNombre) map.set(p.categoriaNombre, p.categoriaNombre);
    }
    return Array.from(map.keys()).sort();
  }, [productos]);

  const filteredByCategoria = catFilter
    ? productos.filter(p => p.categoriaNombre === catFilter)
    : productos;

  // Group filtered products by category for display
  const groups = useMemo(() => {
    const map = new Map<string, typeof productos>();
    for (const p of filteredByCategoria) {
      const cat = p.categoriaNombre ?? "Sin categoría";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(p);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredByCategoria]);

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) setCatFilter(null);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal h-10 text-left"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">
              {selected ? (
                <>
                  <span className="font-medium">{selected.nombre}</span>
                  {selected.categoriaNombre && (
                    <span className="ml-1.5 text-xs text-muted-foreground">({selected.categoriaNombre})</span>
                  )}
                </>
              ) : (
                <span className="text-muted-foreground">Buscar o filtrar por categoría...</span>
              )}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[520px] p-0" align="start">
        {/* Category filter chips */}
        {categorias.length > 1 && (
          <div className="flex flex-wrap gap-1.5 border-b px-3 py-2 bg-muted/30">
            <button
              type="button"
              onClick={() => setCatFilter(null)}
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors",
                catFilter === null
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:bg-accent",
              )}
            >
              Todas
            </button>
            {categorias.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCatFilter(catFilter === cat ? null : cat)}
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors",
                  catFilter === cat
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:bg-accent",
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
        <Command>
          <CommandInput placeholder="Buscar por nombre o SKU..." />
          <CommandList className="max-h-64">
            <CommandEmpty>No se encontraron productos.</CommandEmpty>
            {groups.map(([cat, prods]) => (
              <CommandGroup key={cat} heading={cat}>
                {prods.map(p => (
                  <CommandItem
                    key={p.id}
                    value={`${p.nombre} ${p.categoriaNombre ?? ""} ${p.sku ?? ""}`}
                    onSelect={() => {
                      onChange(p.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn("mr-2 h-4 w-4 shrink-0", Number(value) === p.id ? "opacity-100" : "opacity-0")}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{p.nombre}</span>
                        {p.sku && (
                          <span className="text-[10px] font-mono text-muted-foreground border rounded px-1">{p.sku}</span>
                        )}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

const pedidoSchema = z.object({
  localId: z.coerce.number().optional().nullable(),
  observaciones: z.string().optional().nullable(),
  detalles: z.array(z.object({
    productoId: z.coerce.number().min(1, "Seleccione un producto"),
    cantidad: z.coerce.number().min(1, "La cantidad debe ser mayor a 0"),
    precioUnitario: z.coerce.number().min(0, "El precio no puede ser negativo").optional(),
  })).min(1, "Debe agregar al menos un producto"),
});

type PedidoFormValues = z.infer<typeof pedidoSchema>;

export default function Pedidos() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: me } = useGetMe();
  const isAdmin = me?.role === "admin";
  
  const [estadoFilter, setEstadoFilter] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [selectedPedidoId, setSelectedPedidoId] = useState<number | null>(null);
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [anularId, setAnularId] = useState<number | null>(null);
  const [repeatSourceId, setRepeatSourceId] = useState<number | null>(null);

  const { data: pedidos, isLoading } = useListPedidos({
    estado: estadoFilter === "todos" ? undefined : estadoFilter,
    localId: isAdmin ? undefined : me?.localId || undefined,
  } as any, { query: { refetchInterval: 10_000 } } as any);
  
  const { data: detailPedido, isLoading: isDetailLoading } = useGetPedido(
    selectedPedidoId || 0,
    { query: { refetchInterval: 5_000, enabled: !!selectedPedidoId } } as any,
  );

  const { data: productos } = useListProductos();
  const { data: locales } = useListLocales();

  const filteredPedidos = (pedidos ?? []).filter(p => {
    const term = searchTerm.toLowerCase();
    const matchText = !term ||
      (p.localNombre || "").toLowerCase().includes(term) ||
      p.id.toString().includes(term);
    const pDate = new Date((p as any).createdAt);
    const matchFechaI = !fechaInicio || pDate >= new Date(fechaInicio);
    const matchFechaF = !fechaFin || pDate <= new Date(fechaFin + "T23:59:59");
    return matchText && matchFechaI && matchFechaF;
  });

  const form = useForm<PedidoFormValues>({
    resolver: zodResolver(pedidoSchema),
    defaultValues: {
      localId: me?.localId || null,
      observaciones: "",
      detalles: [{ productoId: 0, cantidad: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "detalles",
  });

  const createMutation = useCreatePedido({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPedidosQueryKey() });
        toast({ title: "Guardado", description: "El pedido ha sido creado exitosamente." });
        setIsNewDialogOpen(false);
        form.reset();
      },
      onError: (error: any) => {
        toast({ variant: "destructive", title: "Error", description: error.message });
      },
    },
  });

  const anularMutation = useAnularPedido({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPedidosQueryKey() });
        toast({ title: "Anulado", description: "El pedido ha sido anulado." });
        setAnularId(null);
      },
      onError: (error: any) => {
        toast({ variant: "destructive", title: "Error", description: error.message });
      },
    },
  });

  const facturarMutation = useFacturarPedido({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPedidosQueryKey() });
        if (selectedPedidoId) queryClient.invalidateQueries({ queryKey: getGetPedidoQueryKey(selectedPedidoId) });
        toast({ title: "Facturado", description: "El pedido ha sido facturado exitosamente." });
      },
      onError: (error: any) => {
        toast({ variant: "destructive", title: "Error", description: error.message });
      },
    },
  });

  const onSubmit = (values: PedidoFormValues) => {
    createMutation.mutate({ data: values });
  };

  const handleOpenDetail = (id: number) => {
    setSelectedPedidoId(id);
    setIsDetailOpen(true);
  };

  const handleRepetirPedido = async (pedidoId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/pedidos/${pedidoId}`);
      if (!res.ok) throw new Error();
      const pedido = await res.json();
      const detalles = pedido.detalles.map((d: any) => ({
        productoId: d.productoId,
        cantidad: d.cantidad,
        precioUnitario: d.precioUnitario ?? undefined,
      }));
      form.reset({
        localId: isAdmin ? (pedido.localId ?? me?.localId ?? null) : (me?.localId ?? null),
        observaciones: "",
        detalles: detalles.length > 0 ? detalles : [{ productoId: 0, cantidad: 1 }],
      });
      setRepeatSourceId(pedidoId);
      setIsNewDialogOpen(true);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "No se pudo cargar el pedido para repetir." });
    }
  };

  const fmtCurrencyPrint = (val: number | null | undefined) => {
    if (val == null) return "₡0,00";
    return "₡" + val.toLocaleString("es-CR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const fmtDatePrint = (str: string | null | undefined) => {
    if (!str) return "-";
    const d = new Date(str);
    const date = d.toLocaleDateString("es-CR", { day: "2-digit", month: "2-digit", year: "numeric" });
    const time = d.toLocaleTimeString("es-CR", { hour: "2-digit", minute: "2-digit" });
    return `${date} ${time}`;
  };

  const printPedidoWindow = (pedido: any) => {
    const win = window.open("", "_blank", "width=850,height=650");
    if (!win) {
      toast({ variant: "destructive", title: "Bloqueado", description: "Active las ventanas emergentes para imprimir." });
      return;
    }
    const estadoLabel = (ESTADO_LABELS[pedido.estado] ?? pedido.estado).toUpperCase();
    const rows = pedido.detalles.map((d: any) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${d.productoNombre}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${d.cantidad}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${fmtCurrencyPrint(d.precioUnitario)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${fmtCurrencyPrint(d.subtotal)}</td>
      </tr>`).join("");

    win.document.write(`<!DOCTYPE html>
<html lang="es"><head>
<meta charset="UTF-8">
<title>Pedido #${String(pedido.id).padStart(6,"0")}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,sans-serif;font-size:12px;color:#111;background:#fff;padding:28px}
.hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:14px;border-bottom:2px solid #111}
.company{font-size:18px;font-weight:700}
.company-sub{font-size:10px;color:#888;margin-top:3px}
.doc-title{font-size:22px;font-weight:700;text-align:right}
.doc-num{font-size:12px;color:#666;text-align:right;margin-top:2px}
.badge{display:inline-block;padding:2px 9px;border-radius:12px;font-size:10px;font-weight:700;letter-spacing:.03em;border:1px solid #d1d5db;background:#f3f4f6;margin-top:5px}
.meta{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px}
.meta-label{font-size:9px;font-weight:700;text-transform:uppercase;color:#888;letter-spacing:.05em;margin-bottom:3px}
.meta-value{font-size:13px;font-weight:600}
table{width:100%;border-collapse:collapse;margin-bottom:16px}
th{background:#f3f4f6;padding:7px 12px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;color:#555;letter-spacing:.04em}
th.r{text-align:right}
th.c{text-align:center}
.totals{display:flex;justify-content:flex-end;margin-bottom:20px}
.totals-box{width:230px}
.trow{display:flex;justify-content:space-between;padding:3px 0;font-size:12px}
.trow.final{font-size:14px;font-weight:700;border-top:1px solid #111;padding-top:7px;margin-top:5px}
.obs{background:#f9fafb;border:1px solid #e5e7eb;border-radius:4px;padding:10px 12px;font-size:11px;color:#555;margin-bottom:20px}
.obs-lbl{font-weight:700;color:#333;margin-bottom:4px}
.footer{border-top:1px solid #e5e7eb;padding-top:10px;text-align:center;font-size:10px;color:#aaa}
@media print{body{padding:12px}}
</style></head><body>
<div class="hdr">
  <div><div class="company">GHF Inventarios y Facturación</div></div>
  <div>
    <div class="doc-title">PEDIDO</div>
    <div class="doc-num">#${String(pedido.id).padStart(6,"0")}</div>
    <div class="doc-num"><span class="badge">${estadoLabel}</span></div>
  </div>
</div>
<div class="meta">
  <div><div class="meta-label">Local solicitante</div><div class="meta-value">${pedido.localNombre ?? "—"}</div></div>
  <div style="text-align:right"><div class="meta-label">Fecha del pedido</div><div class="meta-value">${fmtDatePrint(pedido.createdAt)}</div></div>
</div>
<table>
  <thead><tr><th>Producto</th><th class="c">Cant.</th><th class="r">Precio Unit.</th><th class="r">Subtotal</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
<div class="totals"><div class="totals-box">
  <div class="trow"><span style="color:#666">Subtotal</span><span>${fmtCurrencyPrint(pedido.subtotal)}</span></div>
  ${(() => {
    const tg = new Map<number, number>();
    for (const d of (pedido.detalles ?? [])) {
      const pct = Number(d.impuestoPct) || 13;
      tg.set(pct, (tg.get(pct) ?? 0) + (Number(d.impuesto) || 0));
    }
    const entries = Array.from(tg.entries()).sort((a, b) => a[0] - b[0]);
    if (entries.length <= 1) {
      const label = entries.length === 1 ? `Impuesto ${entries[0][0]}%` : "Impuesto";
      return `<div class="trow"><span style="color:#666">${label}</span><span>${fmtCurrencyPrint(pedido.impuesto)}</span></div>`;
    }
    return entries.map(([pct, imp]) =>
      `<div class="trow"><span style="color:#666">Impuesto ${pct}%</span><span>${fmtCurrencyPrint(imp)}</span></div>`
    ).join("");
  })()}
  <div class="trow final"><span>Total</span><span>${fmtCurrencyPrint(pedido.total)}</span></div>
</div></div>
${pedido.observaciones ? `<div class="obs"><div class="obs-lbl">Observaciones</div>${pedido.observaciones}</div>` : ""}
<div class="footer">Generado el ${fmtDatePrint(new Date().toISOString())} &mdash; GHF Inventarios y Facturación</div>
</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 300);
  };

  const handlePrintPedido = async (pedidoId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/pedidos/${pedidoId}`);
      if (!res.ok) throw new Error();
      const pedido = await res.json();
      printPedidoWindow(pedido);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "No se pudo cargar el pedido para imprimir." });
    }
  };

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
          <h2 className="text-2xl font-bold tracking-tight">Pedidos</h2>
          <p className="text-muted-foreground">Gestión de pedidos de clientes.</p>
        </div>
        <Button onClick={() => setIsNewDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo pedido
        </Button>
      </div>

      <Tabs value={estadoFilter} onValueChange={setEstadoFilter} className="w-full">
        <TabsList>
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="pendiente">Pendientes</TabsTrigger>
          <TabsTrigger value="procesando">Procesando</TabsTrigger>
          <TabsTrigger value="enviando">Enviando</TabsTrigger>
          <TabsTrigger value="facturado">Facturados</TabsTrigger>
          <TabsTrigger value="anulada">Anulados</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por ID o local..." className="pl-9"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input type="date" className="pl-9" value={fechaInicio}
            onChange={e => setFechaInicio(e.target.value)} placeholder="Desde" />
        </div>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input type="date" className="pl-9" value={fechaFin}
            onChange={e => setFechaFin(e.target.value)} placeholder="Hasta" />
        </div>
        {(searchTerm || fechaInicio || fechaFin) && (
          <Button variant="ghost" onClick={() => { setSearchTerm(""); setFechaInicio(""); setFechaFin(""); }}>
            <FilterX className="mr-2 h-4 w-4" /> Limpiar
          </Button>
        )}
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Local</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-center">Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPedidos.map((pedido) => (
              <TableRow key={pedido.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleOpenDetail(pedido.id)}>
                <TableCell className="font-mono text-xs">#{pedido.id}</TableCell>
                <TableCell className="text-xs">{formatDateTime(pedido.createdAt)}</TableCell>
                <TableCell className="font-medium">{pedido.localNombre ?? "—"}</TableCell>
                <TableCell className="text-right font-bold">{formatCurrency(pedido.total)}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className={cn(
                    "capitalize",
                    ESTADO_BADGE_CLASSES[pedido.estado] ?? ""
                  )}>
                    {ESTADO_LABELS[pedido.estado] ?? pedido.estado}
                  </Badge>
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" title="Ver detalle" onClick={() => handleOpenDetail(pedido.id)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Repetir pedido" onClick={(e) => handleRepetirPedido(pedido.id, e)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Imprimir pedido" onClick={(e) => handlePrintPedido(pedido.id, e)}>
                      <Printer className="h-4 w-4" />
                    </Button>
                    {isAdmin && pedido.estado !== "facturado" && pedido.estado !== "anulada" && pedido.estado !== "anulado" && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-green-600"
                        title="Facturar"
                        onClick={() => facturarMutation.mutate({ id: pedido.id })}
                        disabled={facturarMutation.isPending}
                      >
                        <Receipt className="h-4 w-4" />
                      </Button>
                    )}
                    {pedido.estado !== "facturado" && pedido.estado !== "anulada" && pedido.estado !== "anulado" && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive"
                        title="Anular"
                        onClick={() => setAnularId(pedido.id)}
                      >
                        <Ban className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredPedidos.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <ShoppingCart className="h-8 w-8 text-muted-foreground/30" />
                    <span>No hay pedidos registrados.</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isNewDialogOpen} onOpenChange={(open) => {
        setIsNewDialogOpen(open);
        if (!open) { setRepeatSourceId(null); form.reset({ localId: me?.localId || null, observaciones: "", detalles: [{ productoId: 0, cantidad: 1 }] }); }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {repeatSourceId ? (
                <span className="flex items-center gap-2">
                  <Copy className="h-4 w-4" />
                  Repetir Pedido #{repeatSourceId}
                </span>
              ) : "Nuevo Pedido"}
            </DialogTitle>
            {repeatSourceId && (
              <p className="text-sm text-muted-foreground">
                Estos son los productos del pedido anterior. Puede quitar, ajustar cantidades o agregar nuevos antes de enviar.
              </p>
            )}
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {isAdmin && (
                  <FormField
                    control={form.control}
                    name="localId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Local solicitante</FormLabel>
                        <Select
                          onValueChange={(val) => field.onChange(val === "null" ? null : Number(val))}
                          value={field.value?.toString() || "null"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione local..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {locales?.map((l) => (
                              <SelectItem key={l.id} value={l.id.toString()}>{l.nombre}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={form.control}
                  name="observaciones"
                  render={({ field }) => (
                    <FormItem className="md:col-span-3">
                      <FormLabel>Observaciones</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Notas adicionales..." rows={2} {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Detalle de Productos</h3>
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ productoId: 0, cantidad: 1 })}>
                    <Plus className="h-4 w-4 mr-1" /> Agregar línea
                  </Button>
                </div>

                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-4 items-end bg-muted/30 p-3 rounded-md border border-dashed">
                      <div className="flex-1">
                        <FormField
                          control={form.control}
                          name={`detalles.${index}.productoId`}
                          render={({ field: productField }) => (
                            <FormItem>
                              <FormLabel className={index === 0 ? "" : "sr-only"}>Producto</FormLabel>
                              <FormControl>
                                <ProductoCombobox
                                  value={productField.value}
                                  onChange={productField.onChange}
                                  productos={(productos ?? []).filter(p => p.activo)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="w-28">
                        <FormField
                          control={form.control}
                          name={`detalles.${index}.cantidad`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className={index === 0 ? "" : "sr-only"}>Cant.</FormLabel>
                              <FormControl>
                                <Input type="number" min={1} step={1} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive mb-1"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsNewDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Crear Pedido
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Pedido #{detailPedido?.id}
              {detailPedido && (
                <Badge
                  variant="outline"
                  className={cn(
                    "capitalize",
                    ESTADO_BADGE_CLASSES[detailPedido.estado] ?? "",
                  )}
                >
                  {ESTADO_LABELS[detailPedido.estado] ?? detailPedido.estado}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {isDetailLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : detailPedido ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Local solicitante</p>
                  <p className="font-medium text-lg">{detailPedido.localNombre ?? "—"}</p>
                  <p className="text-sm text-muted-foreground">Pedido #{detailPedido.id}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Información</p>
                  <p className="text-sm"><span className="font-medium">Fecha:</span> {formatDateTime(detailPedido.createdAt)}</p>
                  {detailPedido.observaciones && (
                    <p className="text-sm mt-2 italic text-muted-foreground">"{detailPedido.observaciones}"</p>
                  )}
                </div>
              </div>

              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-center">Cant.</TableHead>
                      <TableHead className="text-right">Precio Unit.</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailPedido.detalles.map((det) => (
                      <TableRow key={det.id}>
                        <TableCell className="font-medium">{det.productoNombre}</TableCell>
                        <TableCell className="text-center">{det.cantidad}</TableCell>
                        <TableCell className="text-right">{formatCurrency(det.precioUnitario)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(det.subtotal)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {(() => {
                // Group tax by rate from detail lines
                const taxGroups = new Map<number, number>();
                for (const d of detailPedido.detalles ?? []) {
                  const pct = Number(d.impuestoPct) || 13;
                  const imp = Number(d.impuesto) || 0;
                  taxGroups.set(pct, (taxGroups.get(pct) ?? 0) + imp);
                }
                const taxEntries = Array.from(taxGroups.entries()).sort((a, b) => a[0] - b[0]);
                return (
                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatCurrency(detailPedido.subtotal)}</span>
                      </div>
                      {taxEntries.length > 1 ? (
                        taxEntries.map(([pct, imp]) => (
                          <div key={pct} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Impuesto {pct}%</span>
                            <span>{formatCurrency(imp)}</span>
                          </div>
                        ))
                      ) : (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {taxEntries.length === 1 ? `Impuesto ${taxEntries[0][0]}%` : "Impuesto"}
                          </span>
                          <span>{formatCurrency(detailPedido.impuesto)}</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>{formatCurrency(detailPedido.total)}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {isAdmin && (
                <PedidoEstadoControl
                  pedidoId={detailPedido.id}
                  estado={detailPedido.estado}
                />
              )}

              <PedidoEventos pedidoId={detailPedido.id} />

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => {
                  setIsDetailOpen(false);
                  handleRepetirPedido(detailPedido.id, { stopPropagation: () => {} } as React.MouseEvent);
                }}>
                  <Copy className="h-4 w-4 mr-2" /> Repetir
                </Button>
                <Button variant="outline" onClick={() => printPedidoWindow(detailPedido)}>
                  <Printer className="h-4 w-4 mr-2" /> Imprimir
                </Button>
                {isAdmin &&
                  detailPedido.estado !== "facturado" &&
                  detailPedido.estado !== "anulada" &&
                  detailPedido.estado !== "anulado" && (
                    <>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          setAnularId(detailPedido.id);
                          setIsDetailOpen(false);
                        }}
                      >
                        <Ban className="h-4 w-4 mr-2" /> Anular
                      </Button>
                      <Button
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          facturarMutation.mutate({ id: detailPedido.id });
                          setIsDetailOpen(false);
                        }}
                      >
                        <Receipt className="h-4 w-4 mr-2" /> Facturar
                      </Button>
                    </>
                  )}
                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Cerrar</Button>
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!anularId} onOpenChange={(open) => !open && setAnularId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Anular este pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción marcará el pedido como anulado. No se podrán realizar facturas para este pedido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => anularId && anularMutation.mutate({ id: anularId })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {anularMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Anular Pedido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PedidoEstadoControl({
  pedidoId,
  estado,
}: {
  pedidoId: number;
  estado: string;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [nuevoEstado, setNuevoEstado] = useState<string>("");
  const [nota, setNota] = useState<string>("");

  const cambiarEstado = useCambiarEstadoPedido({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPedidosQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPedidoQueryKey(pedidoId) });
        toast({ title: "Estado actualizado", description: "Se registró el cambio." });
        setNuevoEstado("");
        setNota("");
      },
      onError: (e: any) => {
        toast({
          variant: "destructive",
          title: "Error",
          description: e.message || "No se pudo cambiar el estado",
        });
      },
    },
  });

  if (estado === "facturado" || estado === "anulada" || estado === "anulado") {
    return null;
  }

  const opciones = ESTADOS_GESTIONABLES.filter((e) => e !== estado);

  return (
    <div className="space-y-2 rounded-md border bg-muted/30 p-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Cambiar estado
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Select value={nuevoEstado} onValueChange={setNuevoEstado}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Nuevo estado…" />
          </SelectTrigger>
          <SelectContent>
            {opciones.map((e) => (
              <SelectItem key={e} value={e}>
                {ESTADO_LABELS[e] ?? e}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Nota (opcional)"
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          className="flex-1"
        />
        <Button
          disabled={!nuevoEstado || cambiarEstado.isPending}
          onClick={() =>
            cambiarEstado.mutate({
              id: pedidoId,
              data: { estado: nuevoEstado, nota: nota || null },
            })
          }
        >
          {cambiarEstado.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Aplicar
        </Button>
      </div>
    </div>
  );
}

function PedidoEventos({ pedidoId }: { pedidoId: number }) {
  const { data: eventos, isLoading } = useListPedidoEventos(pedidoId, { query: { refetchInterval: 5_000 } } as any);

  return (
    <div className="space-y-2 rounded-md border p-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Historial de estados
      </p>
      {isLoading ? (
        <div className="flex h-16 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : !eventos || eventos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin eventos.</p>
      ) : (
        <ol className="space-y-2">
          {eventos.map((ev) => (
            <li
              key={ev.id}
              className="flex flex-col gap-1 border-l-2 border-primary/40 pl-3 sm:flex-row sm:items-baseline sm:gap-3"
            >
              <Badge
                variant="outline"
                className={cn(
                  "w-fit capitalize",
                  ESTADO_BADGE_CLASSES[ev.estado] ?? "",
                )}
              >
                {ESTADO_LABELS[ev.estado] ?? ev.estado}
              </Badge>
              <div className="flex-1 space-y-0.5 text-sm">
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(ev.fecha)}
                  {ev.usuarioNombre ? ` · ${ev.usuarioNombre}` : ""}
                </p>
                {ev.nota && <p className="text-sm">{ev.nota}</p>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
