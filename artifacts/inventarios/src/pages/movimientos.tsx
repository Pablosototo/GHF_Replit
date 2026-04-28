import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListMovimientos, 
  useCreateMovimiento,
  useListProductos,
  useListLocales,
  useGetMe,
  getListMovimientosQueryKey
} from "@workspace/api-client-react";
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
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Plus, 
  History,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Search
} from "lucide-react";
import { useForm } from "react-hook-form";
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
import { formatDateTime, cn } from "@/lib/utils";

const movimientoSchema = z.object({
  productoId: z.coerce.number().min(1, "El producto es requerido"),
  localId: z.coerce.number().min(1, "El local es requerido"),
  tipo: z.enum(["entrada", "salida", "ajuste"]),
  cantidad: z.coerce.number().min(0.01, "La cantidad debe ser mayor a 0"),
  nota: z.string().optional().nullable(),
});

type MovimientoFormValues = z.infer<typeof movimientoSchema>;

export default function Movimientos() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: me } = useGetMe();
  const isAdmin = me?.role === "admin";
  
  const [limit, setLimit] = useState(50);
  const [localFilter, setLocalFilter] = useState<string>(isAdmin ? "all" : (me?.localId?.toString() || "all"));
  
  const { data: movimientos, isLoading } = useListMovimientos({
    localId: localFilter !== "all" ? Number(localFilter) : undefined,
    limite: limit,
  });
  
  const { data: productos } = useListProductos();
  const { data: locales } = useListLocales();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<MovimientoFormValues>({
    resolver: zodResolver(movimientoSchema),
    defaultValues: {
      productoId: undefined,
      localId: me?.localId || undefined,
      tipo: "entrada",
      cantidad: 1,
      nota: "",
    },
  });

  const createMutation = useCreateMovimiento({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMovimientosQueryKey() });
        toast({ title: "Guardado", description: "El movimiento ha sido registrado exitosamente." });
        setIsDialogOpen(false);
        form.reset();
      },
      onError: (error: any) => {
        toast({ variant: "destructive", title: "Error", description: error.message });
      },
    },
  });

  const onSubmit = (values: MovimientoFormValues) => {
    createMutation.mutate({ data: values });
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
          <h2 className="text-2xl font-bold tracking-tight">Movimientos de Stock</h2>
          <p className="text-muted-foreground">Registro histórico de entradas, salidas y ajustes.</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo movimiento
        </Button>
      </div>

      {isAdmin && (
        <div className="w-[250px]">
          <Select value={localFilter} onValueChange={setLocalFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por local" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los locales</SelectItem>
              {locales?.map((l) => (
                <SelectItem key={l.id} value={l.id.toString()}>{l.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Local</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead>Nota</TableHead>
              <TableHead>Usuario</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movimientos?.map((mov) => (
              <TableRow key={mov.id}>
                <TableCell className="text-xs">{formatDateTime(mov.createdAt)}</TableCell>
                <TableCell className="font-medium">{mov.productoNombre}</TableCell>
                <TableCell>{mov.localNombre}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn(
                    "capitalize",
                    mov.tipo === "entrada" ? "bg-green-50 text-green-700 border-green-200" :
                    mov.tipo === "salida" ? "bg-red-50 text-red-700 border-red-200" :
                    mov.tipo === "venta" ? "bg-blue-50 text-blue-700 border-blue-200" :
                    "bg-yellow-50 text-yellow-700 border-yellow-200"
                  )}>
                    {mov.tipo === "entrada" && <ArrowUpRight className="h-3 w-3 mr-1" />}
                    {mov.tipo === "salida" && <ArrowDownRight className="h-3 w-3 mr-1" />}
                    {mov.tipo === "venta" && <ArrowDownRight className="h-3 w-3 mr-1" />}
                    {mov.tipo === "ajuste" && <RefreshCw className="h-3 w-3 mr-1" />}
                    {mov.tipo}
                  </Badge>
                </TableCell>
                <TableCell className={cn(
                  "text-right font-bold",
                  mov.tipo === "entrada" ? "text-green-600" : 
                  (mov.tipo === "salida" || mov.tipo === "venta") ? "text-destructive" : ""
                )}>
                  {mov.tipo === "entrada" ? "+" : "-"}{mov.cantidad}
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                  {mov.nota || "-"}
                </TableCell>
                <TableCell className="text-xs">
                  {mov.usuarioNombre}
                </TableCell>
              </TableRow>
            ))}
            {movimientos?.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <History className="h-8 w-8 text-muted-foreground/30" />
                    <span>No hay movimientos registrados.</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nuevo movimiento de stock</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="productoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Producto</FormLabel>
                    <Select 
                      onValueChange={(val) => field.onChange(Number(val))} 
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un producto..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {productos?.map((p) => (
                          <SelectItem key={p.id} value={p.id.toString()}>
                            {p.nombre} {p.sku ? `(${p.sku})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {isAdmin && (
                <FormField
                  control={form.control}
                  name="localId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Local</FormLabel>
                      <Select 
                        onValueChange={(val) => field.onChange(Number(val))} 
                        value={field.value?.toString()}
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
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de movimiento</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="entrada">Entrada</SelectItem>
                          <SelectItem value="salida">Salida</SelectItem>
                          <SelectItem value="ajuste">Ajuste</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cantidad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cantidad</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="nota"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nota / Observación</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Razón del movimiento..." {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Registrar movimiento
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
