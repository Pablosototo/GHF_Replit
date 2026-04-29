import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListProductos,
  useListCategorias,
  useListLocales,
  useListPedidos,
  useGetPedido,
  useCreatePedido,
  useCreateFactura,
  useGetMe,
  getListPedidosQueryKey,
  getListFacturasQueryKey,
  getListStockQueryKey,
  type Producto,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Minus,
  Search,
  ShoppingCart,
  Trash2,
  Loader2,
  Package,
  Receipt,
  Send,
  RotateCcw,
  Clock,
} from "lucide-react";
import { formatCurrency, formatDateTime, cn } from "@/lib/utils";
import { ESTADO_LABELS, ESTADO_BADGE_CLASSES } from "@/lib/pedido-estados";

const CATEGORIA_COLORS = [
  { base: "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100", active: "bg-indigo-600 text-white border-indigo-600" },
  { base: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100", active: "bg-emerald-600 text-white border-emerald-600" },
  { base: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100", active: "bg-amber-500 text-white border-amber-500" },
  { base: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100", active: "bg-rose-600 text-white border-rose-600" },
  { base: "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100", active: "bg-violet-600 text-white border-violet-600" },
  { base: "bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100", active: "bg-cyan-600 text-white border-cyan-600" },
  { base: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100", active: "bg-orange-500 text-white border-orange-500" },
  { base: "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100", active: "bg-teal-600 text-white border-teal-600" },
];

interface CartLine {
  productoId: number;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
  impuestoPct: number;
}

interface CatalogoProps {
  mode?: "pedido" | "factura";
}

export default function Catalogo({ mode = "pedido" }: CatalogoProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { data: me } = useGetMe();
  const isAdmin = me?.role === "admin";
  const isFactura = mode === "factura";
  const isPedido = !isFactura;

  const { data: categorias } = useListCategorias();
  const { data: productos, isLoading } = useListProductos();
  const { data: locales } = useListLocales();

  const [tab, setTab] = useState<"catalogo" | "historial">("catalogo");
  const [categoriaId, setCategoriaId] = useState<number | "todas">("todas");
  const [busqueda, setBusqueda] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [observaciones, setObservaciones] = useState("");
  const [localId, setLocalId] = useState<number | null>(me?.localId ?? null);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    if (me?.localId && localId == null) setLocalId(me.localId);
  }, [me?.localId, localId]);

  const createPedido = useCreatePedido();
  const createFactura = useCreateFactura();

  const filtered = useMemo(() => {
    return (productos ?? []).filter((p) => {
      if (!p.activo) return false;
      if (categoriaId !== "todas" && p.categoriaId !== categoriaId) return false;
      if (busqueda) {
        const q = busqueda.toLowerCase();
        if (
          !p.nombre.toLowerCase().includes(q) &&
          !(p.sku ?? "").toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [productos, categoriaId, busqueda]);

  const cantidadEnCarro = (productoId: number) =>
    cart.find((c) => c.productoId === productoId)?.cantidad ?? 0;

  const addToCart = (p: Producto) => {
    setCart((curr) => {
      const idx = curr.findIndex((c) => c.productoId === p.id);
      if (idx >= 0) {
        const next = [...curr];
        next[idx] = { ...next[idx], cantidad: next[idx].cantidad + 1 };
        return next;
      }
      return [
        ...curr,
        {
          productoId: p.id,
          nombre: p.nombre,
          precioUnitario: Number(p.precio),
          cantidad: 1,
          impuestoPct: p.impuestoPct ?? 13,
        },
      ];
    });
  };

  const inc = (productoId: number) => {
    setCart((curr) =>
      curr.map((c) =>
        c.productoId === productoId ? { ...c, cantidad: c.cantidad + 1 } : c,
      ),
    );
  };

  const dec = (productoId: number) => {
    setCart((curr) => {
      const next = curr
        .map((c) =>
          c.productoId === productoId ? { ...c, cantidad: c.cantidad - 1 } : c,
        )
        .filter((c) => c.cantidad > 0);
      return next;
    });
  };

  const removeFromCart = (productoId: number) => {
    setCart((curr) => curr.filter((c) => c.productoId !== productoId));
  };

  const setQty = (productoId: number, value: string) => {
    const n = parseInt(value, 10);
    if (isNaN(n) || value === "") {
      setCart((curr) =>
        curr.map((c) => (c.productoId === productoId ? { ...c, cantidad: 0 } : c)),
      );
      return;
    }
    if (n <= 0) {
      removeFromCart(productoId);
      return;
    }
    setCart((curr) =>
      curr.map((c) => (c.productoId === productoId ? { ...c, cantidad: n } : c)),
    );
  };

  const commitQty = (productoId: number) => {
    setCart((curr) => curr.filter((c) => c.cantidad > 0));
  };

  const subtotal = useMemo(
    () => cart.reduce((sum, c) => sum + c.precioUnitario * c.cantidad, 0),
    [cart],
  );
  const taxGroups = useMemo(() => {
    const map = new Map<number, number>();
    for (const c of cart) {
      const lineSubtotal = c.precioUnitario * c.cantidad;
      const lineTax = Number((lineSubtotal * (c.impuestoPct / 100)).toFixed(2));
      map.set(c.impuestoPct, (map.get(c.impuestoPct) ?? 0) + lineTax);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([pct, monto]) => ({ pct, monto: Number(monto.toFixed(2)) }));
  }, [cart]);
  const impuesto = useMemo(
    () => Number(taxGroups.reduce((sum, g) => sum + g.monto, 0).toFixed(2)),
    [taxGroups],
  );
  const total = Number((subtotal + impuesto).toFixed(2));
  const totalUnidades = useMemo(
    () => cart.reduce((sum, c) => sum + c.cantidad, 0),
    [cart],
  );

  const submitting = createPedido.isPending || createFactura.isPending;

  const onSubmit = () => {
    if (cart.length === 0) {
      toast({
        title: "Carro vacío",
        description: "Agrega al menos un producto.",
        variant: "destructive",
      });
      return;
    }
    if (isFactura && !localId && isAdmin) {
      toast({
        title: "Local requerido",
        description: "Selecciona el local para emitir la factura.",
        variant: "destructive",
      });
      return;
    }

    const basePayload = {
      localId: isAdmin ? localId : me?.localId ?? null,
      clienteNombre: null,
      clienteTelefono: null,
      clienteEmail: null,
      observaciones: observaciones || null,
    };

    if (isFactura) {
      createFactura.mutate(
        {
          data: {
            ...basePayload,
            impuestoPct: 0,
            detalles: cart.map((c) => ({
              productoId: c.productoId,
              cantidad: c.cantidad,
              precioUnitario: c.precioUnitario,
            })),
          },
        },
        {
          onSuccess: (factura) => {
            queryClient.invalidateQueries({ queryKey: getListFacturasQueryKey() });
            queryClient.invalidateQueries({ queryKey: getListStockQueryKey() });
            toast({
              title: "Factura emitida",
              description: `Número ${factura.numeroFactura} – ${formatCurrency(factura.total)}`,
            });
            resetForm();
            setLocation("/facturas");
          },
          onError: (e) => {
            toast({
              title: "Error al facturar",
              description: e.message || "No se pudo crear la factura",
              variant: "destructive",
            });
          },
        },
      );
    } else {
      // Pedido: do NOT send prices or impuesto — backend uses producto.precio
      createPedido.mutate(
        {
          data: {
            ...basePayload,
            impuestoPct: 0,
            detalles: cart.map((c) => ({
              productoId: c.productoId,
              cantidad: c.cantidad,
            })),
          },
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListPedidosQueryKey() });
            toast({
              title: "Pedido enviado",
              description: "Tu pedido fue enviado al administrador.",
            });
            resetForm();
            setTab("historial");
          },
          onError: (e) => {
            toast({
              title: "Error",
              description: e.message || "No se pudo crear el pedido",
              variant: "destructive",
            });
          },
        },
      );
    }
  };

  const resetForm = () => {
    setCart([]);
    setObservaciones("");
    setCartOpen(false);
  };

  const Resumen = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-4">
        <div className="flex items-center gap-2">
          {isFactura ? (
            <Receipt className="h-5 w-5 text-primary" />
          ) : (
            <ShoppingCart className="h-5 w-5 text-primary" />
          )}
          <h3 className="text-lg font-semibold">
            {isFactura ? "Nueva factura" : "Tu pedido"}
          </h3>
        </div>
        <Badge variant="secondary">{cart.length} ítem(s)</Badge>
      </div>

      {isAdmin && isFactura && (
        <div className="space-y-2 border-b p-4">
          <label className="text-xs font-medium text-muted-foreground">
            Local
          </label>
          <Select
            value={localId ? String(localId) : ""}
            onValueChange={(v) => setLocalId(v ? Number(v) : null)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un local" />
            </SelectTrigger>
            <SelectContent>
              {locales?.map((l) => (
                <SelectItem key={l.id} value={String(l.id)}>
                  {l.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <ScrollArea className="flex-1">
        {cart.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-16 text-center text-muted-foreground">
            <ShoppingCart className="h-10 w-10 opacity-30" />
            <p className="text-sm">
              Aún no agregaste productos.
              <br />
              Toca un producto para empezar.
            </p>
          </div>
        ) : (
          <ul className="divide-y">
            {cart.map((c) => (
              <li key={c.productoId} className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.nombre}</p>
                    {isFactura && (
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(c.precioUnitario)} c/u
                      </p>
                    )}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => removeFromCart(c.productoId)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 rounded-md border bg-muted/30">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => dec(c.productoId)}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <input
                      type="number"
                      min={1}
                      value={c.cantidad || ""}
                      onChange={(e) => setQty(c.productoId, e.target.value)}
                      onBlur={() => commitQty(c.productoId)}
                      className="w-12 border-0 bg-transparent text-center text-sm font-semibold tabular-nums focus:outline-none focus:ring-1 focus:ring-primary rounded"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => inc(c.productoId)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {isFactura && (
                    <span className="text-sm font-bold tabular-nums">
                      {formatCurrency(c.precioUnitario * c.cantidad)}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>

      <div className="space-y-3 border-t bg-muted/30 p-4">
        <div className="space-y-2">
          <Textarea
            placeholder="Observaciones"
            rows={2}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
          />
        </div>
        <Separator />
        {isFactura ? (
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatCurrency(subtotal)}</span>
            </div>
            {taxGroups.map((g) => (
              <div key={g.pct} className="flex justify-between text-muted-foreground">
                <span>Impuesto {g.pct}%</span>
                <span className="tabular-nums">{formatCurrency(g.monto)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t pt-2 text-base font-bold">
              <span>Total</span>
              <span className="tabular-nums">{formatCurrency(total)}</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-between border-t pt-2 text-base font-bold">
            <span>Total de unidades</span>
            <span className="tabular-nums">{totalUnidades}</span>
          </div>
        )}
        <Button
          className="w-full"
          size="lg"
          disabled={cart.length === 0 || submitting}
          onClick={onSubmit}
        >
          {submitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : isFactura ? (
            <Receipt className="mr-2 h-4 w-4" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          {isFactura ? "Emitir factura" : "Enviar pedido"}
        </Button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleRepetir = (lineas: Array<{ productoId: number; cantidad: number }>) => {
    const nuevasLineas: CartLine[] = [];
    for (const l of lineas) {
      const prod = productos?.find((p) => p.id === l.productoId);
      if (!prod || !prod.activo) continue;
      nuevasLineas.push({
        productoId: prod.id,
        nombre: prod.nombre,
        precioUnitario: Number(prod.precio),
        cantidad: l.cantidad,
        impuestoPct: prod.impuestoPct ?? 13,
      });
    }
    if (nuevasLineas.length === 0) {
      toast({
        title: "Sin productos disponibles",
        description: "Los productos del pedido anterior ya no están activos.",
        variant: "destructive",
      });
      return;
    }
    setCart(nuevasLineas);
    setTab("catalogo");
    setCartOpen(true);
    toast({
      title: "Pedido cargado",
      description: `${nuevasLineas.length} producto(s) agregado(s) al carro.`,
    });
  };

  const Catalogo = (
    <div className="flex h-[calc(100vh-12rem)] gap-6">
      <div className="flex flex-1 flex-col gap-4 overflow-hidden">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar producto o SKU…"
              className="pl-9"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <Sheet open={cartOpen} onOpenChange={setCartOpen}>
            <SheetTrigger asChild>
              <Button className="lg:hidden" size="lg">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Carro ({cart.length})
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-md p-0 sm:max-w-md">
              {Resumen}
            </SheetContent>
          </Sheet>
        </div>

        <ScrollArea className="-mx-2 flex-1 px-2">
          <div className="space-y-6 pb-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCategoriaId("todas")}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm font-medium transition",
                  categoriaId === "todas"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:bg-muted",
                )}
              >
                Todas
              </button>
              {categorias?.map((c, idx) => {
                const color = CATEGORIA_COLORS[idx % CATEGORIA_COLORS.length];
                const isActive = categoriaId === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setCategoriaId(c.id)}
                    className={cn(
                      "rounded-full border px-4 py-1.5 text-sm font-medium transition",
                      isActive ? color.active : color.base,
                    )}
                  >
                    {c.nombre}
                  </button>
                );
              })}
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-muted-foreground">
                <Package className="h-10 w-10 opacity-30" />
                <p className="text-sm">No hay productos para mostrar.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {filtered.map((p) => {
                  const enCarro = cantidadEnCarro(p.id);
                  return (
                    <Card
                      key={p.id}
                      className={cn(
                        "group relative overflow-hidden transition-all",
                        enCarro > 0 && "ring-2 ring-primary",
                      )}
                    >
                      <CardContent className="flex flex-col gap-3 p-4">
                        <div className="space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="line-clamp-2 text-sm font-semibold leading-tight">
                              {p.nombre}
                            </p>
                            {p.sku && (
                              <Badge variant="outline" className="shrink-0 font-mono text-[10px]">
                                {p.sku}
                              </Badge>
                            )}
                          </div>
                          {p.categoriaNombre && (
                            <p className="text-xs text-muted-foreground">
                              {p.categoriaNombre}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          {isFactura ? (
                            <span className="text-lg font-bold tabular-nums">
                              {formatCurrency(p.precio)}
                            </span>
                          ) : (
                            <span />
                          )}
                          {enCarro === 0 ? (
                            <Button
                              size="sm"
                              onClick={() => addToCart(p)}
                              className="gap-1"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Agregar
                            </Button>
                          ) : (
                            <div className="flex items-center gap-1 rounded-md border bg-muted/40">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => dec(p.id)}
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </Button>
                              <input
                                type="number"
                                min={1}
                                value={enCarro || ""}
                                onChange={(e) => setQty(p.id, e.target.value)}
                                onBlur={() => commitQty(p.id)}
                                className="w-12 border-0 bg-transparent text-center text-sm font-semibold tabular-nums focus:outline-none focus:ring-1 focus:ring-primary rounded"
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => inc(p.id)}
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <aside className="hidden w-[360px] shrink-0 overflow-hidden rounded-lg border bg-card lg:block">
        {Resumen}
      </aside>
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          {isFactura ? "Facturación rápida" : "Catálogo de productos"}
        </h2>
        <p className="text-muted-foreground">
          {isFactura
            ? "Arma una factura y emítela inmediatamente."
            : "Agrega productos al carro y envía tu pedido al administrador."}
        </p>
      </div>

      {isPedido ? (
        <Tabs value={tab} onValueChange={(v) => setTab(v as "catalogo" | "historial")}>
          <TabsList>
            <TabsTrigger value="catalogo">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Catálogo
            </TabsTrigger>
            <TabsTrigger value="historial">
              <Clock className="mr-2 h-4 w-4" />
              Mis pedidos
            </TabsTrigger>
          </TabsList>
          <TabsContent value="catalogo" className="mt-4">
            {Catalogo}
          </TabsContent>
          <TabsContent value="historial" className="mt-4">
            <HistorialPedidos onRepetir={handleRepetir} localId={me?.localId ?? null} />
          </TabsContent>
        </Tabs>
      ) : (
        Catalogo
      )}
    </div>
  );
}

function HistorialPedidos({
  onRepetir,
  localId,
}: {
  onRepetir: (lineas: Array<{ productoId: number; cantidad: number }>) => void;
  localId: number | null;
}) {
  const { data: pedidos, isLoading } = useListPedidos({
    localId: localId ?? undefined,
  });
  const [openId, setOpenId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!pedidos || pedidos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-muted-foreground">
        <ShoppingCart className="h-10 w-10 opacity-30" />
        <p className="text-sm">Aún no has enviado pedidos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pedidos.map((p) => (
        <PedidoHistorialCard
          key={p.id}
          pedidoId={p.id}
          fecha={p.createdAt}
          estado={p.estado}
          isOpen={openId === p.id}
          onToggle={() => setOpenId(openId === p.id ? null : p.id)}
          onRepetir={onRepetir}
        />
      ))}
    </div>
  );
}

function PedidoHistorialCard({
  pedidoId,
  fecha,
  estado,
  isOpen,
  onToggle,
  onRepetir,
}: {
  pedidoId: number;
  fecha: string;
  estado: string;
  isOpen: boolean;
  onToggle: () => void;
  onRepetir: (lineas: Array<{ productoId: number; cantidad: number }>) => void;
}) {
  const { data: detalle } = useGetPedido(pedidoId, {
    query: { enabled: isOpen } as any,
  });

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-semibold">#{pedidoId}</span>
            <span className="text-sm text-muted-foreground">
              {formatDateTime(fecha)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn("capitalize", ESTADO_BADGE_CLASSES[estado] ?? "")}
            >
              {ESTADO_LABELS[estado] ?? estado}
            </Badge>
            <Button variant="outline" size="sm" onClick={onToggle}>
              {isOpen ? "Ocultar" : "Ver detalle"}
            </Button>
          </div>
        </div>

        {isOpen && detalle && (
          <div className="space-y-3 rounded-md border bg-muted/20 p-3">
            <ul className="divide-y">
              {detalle.detalles.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between py-2 text-sm"
                >
                  <span className="font-medium">{d.productoNombre}</span>
                  <span className="text-muted-foreground">x {d.cantidad}</span>
                </li>
              ))}
            </ul>
            {detalle.observaciones && (
              <p className="rounded-md bg-card p-2 text-xs italic text-muted-foreground">
                "{detalle.observaciones}"
              </p>
            )}
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={() =>
                  onRepetir(
                    detalle.detalles.map((d) => ({
                      productoId: d.productoId,
                      cantidad: d.cantidad,
                    })),
                  )
                }
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Repetir pedido
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
