import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListProductos,
  useListCategorias,
  useListLocales,
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
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";

interface CartLine {
  productoId: number;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
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

  const { data: categorias } = useListCategorias();
  const { data: productos, isLoading } = useListProductos();
  const { data: locales } = useListLocales();

  const [categoriaId, setCategoriaId] = useState<number | "todas">("todas");
  const [busqueda, setBusqueda] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [impuestoPct, setImpuestoPct] = useState<number>(13);
  const [localId, setLocalId] = useState<number | null>(me?.localId ?? null);
  const [cartOpen, setCartOpen] = useState(false);

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

  const subtotal = useMemo(
    () => cart.reduce((sum, c) => sum + c.precioUnitario * c.cantidad, 0),
    [cart],
  );
  const impuesto = Number((subtotal * (impuestoPct / 100)).toFixed(2));
  const total = Number((subtotal + impuesto).toFixed(2));

  const isFactura = mode === "factura";
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

    const payload = {
      localId: isAdmin ? localId : me?.localId ?? null,
      clienteNombre: clienteNombre || null,
      clienteTelefono: clienteTelefono || null,
      clienteEmail: null,
      observaciones: observaciones || null,
      impuestoPct,
      detalles: cart.map((c) => ({
        productoId: c.productoId,
        cantidad: c.cantidad,
        precioUnitario: c.precioUnitario,
      })),
    };

    if (isFactura) {
      createFactura.mutate(
        { data: payload },
        {
          onSuccess: (factura) => {
            queryClient.invalidateQueries({ queryKey: getListFacturasQueryKey() });
            queryClient.invalidateQueries({ queryKey: getListStockQueryKey() });
            toast({
              title: "Factura emitida",
              description: `Número ${factura.numeroFactura} – ${formatCurrency(factura.total)}`,
            });
            setCart([]);
            setClienteNombre("");
            setClienteTelefono("");
            setObservaciones("");
            setCartOpen(false);
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
      createPedido.mutate(
        { data: payload },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListPedidosQueryKey() });
            toast({
              title: "Pedido enviado",
              description: "Tu pedido fue enviado al administrador.",
            });
            setCart([]);
            setClienteNombre("");
            setClienteTelefono("");
            setObservaciones("");
            setCartOpen(false);
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

      {isAdmin && (
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
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(c.precioUnitario)} c/u
                    </p>
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
                    <span className="w-8 text-center text-sm font-medium tabular-nums">
                      {c.cantidad}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => inc(c.productoId)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <span className="text-sm font-bold tabular-nums">
                    {formatCurrency(c.precioUnitario * c.cantidad)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>

      <div className="space-y-3 border-t bg-muted/30 p-4">
        <div className="space-y-2">
          <Input
            placeholder="Nombre del cliente (opcional)"
            value={clienteNombre}
            onChange={(e) => setClienteNombre(e.target.value)}
          />
          <Input
            placeholder="Teléfono (opcional)"
            value={clienteTelefono}
            onChange={(e) => setClienteTelefono(e.target.value)}
          />
          <Textarea
            placeholder="Observaciones"
            rows={2}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <label className="flex-1 text-xs text-muted-foreground">
              Impuesto %
            </label>
            <Input
              type="number"
              className="w-24"
              value={impuestoPct}
              onChange={(e) => setImpuestoPct(Number(e.target.value) || 0)}
              min={0}
              max={100}
            />
          </div>
        </div>
        <Separator />
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Impuesto ({impuestoPct}%)</span>
            <span className="tabular-nums">{formatCurrency(impuesto)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 text-base font-bold">
            <span>Total</span>
            <span className="tabular-nums">{formatCurrency(total)}</span>
          </div>
        </div>
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

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Productos */}
      <div className="flex flex-1 flex-col gap-4 overflow-hidden">
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

        <ScrollArea className="flex-1 -mx-2 px-2">
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
              {categorias?.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategoriaId(c.id)}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-sm font-medium transition",
                    categoriaId === c.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:bg-muted",
                  )}
                >
                  {c.nombre}
                </button>
              ))}
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
                        <div className="flex aspect-[4/3] items-center justify-center rounded-md bg-muted">
                          <Package className="h-12 w-12 text-muted-foreground/40" />
                        </div>
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
                          <span className="text-lg font-bold tabular-nums">
                            {formatCurrency(p.precio)}
                          </span>
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
                              <span className="w-7 text-center text-sm font-semibold tabular-nums">
                                {enCarro}
                              </span>
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

      {/* Resumen sticky (desktop) */}
      <aside className="hidden w-[360px] shrink-0 overflow-hidden rounded-lg border bg-card lg:block">
        {Resumen}
      </aside>
    </div>
  );
}
