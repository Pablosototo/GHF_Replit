import { useState } from "react";
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
  getListPedidosQueryKey
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
  Eye
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

const pedidoSchema = z.object({
  localId: z.coerce.number().optional().nullable(),
  observaciones: z.string().optional().nullable(),
  impuestoPct: z.coerce.number().min(0, "El impuesto no puede ser negativo").default(13),
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
  const [selectedPedidoId, setSelectedPedidoId] = useState<number | null>(null);
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [anularId, setAnularId] = useState<number | null>(null);

  const { data: pedidos, isLoading } = useListPedidos({
    estado: estadoFilter === "todos" ? undefined : estadoFilter,
    localId: isAdmin ? undefined : me?.localId || undefined,
  });
  
  const { data: detailPedido, isLoading: isDetailLoading } = useGetPedido(selectedPedidoId || 0);

  const { data: productos } = useListProductos();
  const { data: locales } = useListLocales();

  const form = useForm<PedidoFormValues>({
    resolver: zodResolver(pedidoSchema),
    defaultValues: {
      localId: me?.localId || null,
      observaciones: "",
      impuestoPct: 13,
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
            {pedidos?.map((pedido) => (
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
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDetail(pedido.id)}>
                      <Eye className="h-4 w-4" />
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
            {pedidos?.length === 0 && (
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

      <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Pedido</DialogTitle>
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
                  name="impuestoPct"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Impuesto (%)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                              <Select
                                onValueChange={(val) => productField.onChange(Number(val))}
                                value={productField.value?.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Producto..." />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {productos?.filter(p => p.activo).map((p) => (
                                    <SelectItem key={p.id} value={p.id.toString()}>
                                      {p.nombre}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
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

              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(detailPedido.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Impuesto</span>
                    <span>{formatCurrency(detailPedido.impuesto)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>{formatCurrency(detailPedido.total)}</span>
                  </div>
                </div>
              </div>

              {isAdmin && (
                <PedidoEstadoControl
                  pedidoId={detailPedido.id}
                  estado={detailPedido.estado}
                />
              )}

              <PedidoEventos pedidoId={detailPedido.id} />

              <DialogFooter className="gap-2">
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
  const { data: eventos, isLoading } = useListPedidoEventos(pedidoId);

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
