import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListLocales, useCreateLocal, useUpdateLocal, useDeleteLocal,
  useListMarcas, useListSociedades, getListLocalesQueryKey, useListProductos
} from "@workspace/api-client-react";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, Plus, Pencil, Trash2, CheckCircle2, XCircle, Store, Search, FilterX, Package
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";

const localSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  codigo: z.string().optional().nullable(),
  marcaId: z.coerce.number().optional().nullable(),
  sociedadId: z.coerce.number().optional().nullable(),
  correo: z.string().email("Correo inválido").optional().nullable().or(z.literal("")),
  telefono: z.string().optional().nullable(),
  direccion: z.string().optional().nullable(),
  activo: z.boolean().default(true),
});
type LocalFormValues = z.infer<typeof localSchema>;

function ProductosLocalPanel({ localId }: { localId: number }) {
  const { toast } = useToast();
  const { data: productos } = useListProductos({ activo: true } as any);
  const [disabledIds, setDisabledIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/locales/${localId}/productos`)
      .then(r => r.json())
      .then((data: { productoId: number; habilitado: boolean }[]) => {
        const disabled = data
          .filter(p => !p.habilitado)
          .map(p => p.productoId);
        setDisabledIds(new Set(disabled));
      })
      .finally(() => setLoading(false));
  }, [localId]);

  const toggle = (id: number, enabled: boolean) => {
    setDisabledIds(prev => {
      const s = new Set(prev);
      if (enabled) s.delete(id);
      else s.add(id);
      return s;
    });
  };

  const toggleAll = (enabled: boolean) => {
    if (enabled) {
      setDisabledIds(new Set());
    } else {
      const allIds = (productos ?? []).map(p => p.id);
      setDisabledIds(new Set(allIds));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/locales/${localId}/productos`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disabledIds: Array.from(disabledIds) }),
      });
      toast({ title: "Guardado", description: "Productos actualizados para este local." });
    } catch {
      toast({ variant: "destructive", title: "Error al guardar" });
    } finally {
      setSaving(false);
    }
  };

  const filteredProductos = (productos ?? []).filter(p =>
    !searchTerm || p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.categoriaNombre || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const allEnabled = disabledIds.size === 0;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Marque los productos disponibles para pedir desde este local. Por defecto todos están habilitados.
      </p>

      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input className="pl-8 h-8 text-sm" placeholder="Buscar..." value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <Button size="sm" variant="outline" onClick={() => toggleAll(true)}>Habilitar todos</Button>
        <Button size="sm" variant="outline" onClick={() => toggleAll(false)}>Deshabilitar todos</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : (
        <div className="max-h-80 overflow-y-auto space-y-1 rounded-md border p-2">
          {filteredProductos.map(p => {
            const enabled = !disabledIds.has(p.id);
            return (
              <label key={p.id}
                className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted/50 cursor-pointer">
                <Checkbox checked={enabled} onCheckedChange={v => toggle(p.id, !!v)} />
                <span className="flex-1 text-sm">{p.nombre}</span>
                {p.categoriaNombre && (
                  <Badge variant="outline" className="text-xs">{p.categoriaNombre}</Badge>
                )}
                {!enabled && <Badge variant="secondary" className="text-xs text-muted-foreground">Deshabilitado</Badge>}
              </label>
            );
          })}
          {filteredProductos.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">Sin productos.</p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <span className="text-sm text-muted-foreground">
          {(productos?.length ?? 0) - disabledIds.size} de {productos?.length ?? 0} habilitados
        </span>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}

export default function Locales() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: locales, isLoading } = useListLocales();
  const { data: marcas } = useListMarcas();
  const { data: sociedades } = useListSociedades();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLocal, setEditingLocal] = useState<any>(null);
  const [deletingLocal, setDeletingLocal] = useState<any>(null);
  const [productosLocal, setProductosLocal] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [marcaFilter, setMarcaFilter] = useState("todos");

  const filtered = locales?.filter(l => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term ||
      l.nombre.toLowerCase().includes(term) ||
      (l.codigo || "").toLowerCase().includes(term) ||
      (l.marcaNombre || "").toLowerCase().includes(term);
    const matchesMarca = marcaFilter === "todos" || l.marcaId?.toString() === marcaFilter;
    return matchesSearch && matchesMarca;
  }) ?? [];

  const form = useForm<LocalFormValues>({
    resolver: zodResolver(localSchema),
    defaultValues: {
      nombre: "", codigo: "", marcaId: null, sociedadId: null,
      correo: "", telefono: "", direccion: "", activo: true,
    },
  });

  const createMutation = useCreateLocal({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListLocalesQueryKey() });
        toast({ title: "Guardado", description: "Local creado exitosamente." });
        setIsDialogOpen(false);
        form.reset();
      },
      onError: (error: any) => toast({ variant: "destructive", title: "Error", description: error.message }),
    },
  });

  const updateMutation = useUpdateLocal({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListLocalesQueryKey() });
        toast({ title: "Actualizado", description: "Local actualizado exitosamente." });
        setIsDialogOpen(false);
        setEditingLocal(null);
        form.reset();
      },
      onError: (error: any) => toast({ variant: "destructive", title: "Error", description: error.message }),
    },
  });

  const deleteMutation = useDeleteLocal({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListLocalesQueryKey() });
        toast({ title: "Eliminado", description: "Local eliminado." });
        setDeletingLocal(null);
      },
      onError: (error: any) => toast({ variant: "destructive", title: "Error", description: error.message }),
    },
  });

  const onSubmit = (values: LocalFormValues) => {
    if (editingLocal) updateMutation.mutate({ id: editingLocal.id, data: values });
    else createMutation.mutate({ data: values });
  };

  const handleEdit = (local: any) => {
    setEditingLocal(local);
    form.reset({
      nombre: local.nombre, codigo: local.codigo || "",
      marcaId: local.marcaId || null, sociedadId: local.sociedadId || null,
      correo: local.correo || "", telefono: local.telefono || "",
      direccion: local.direccion || "", activo: local.activo,
    });
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingLocal(null);
    form.reset({ nombre: "", codigo: "", marcaId: null, sociedadId: null, correo: "", telefono: "", direccion: "", activo: true });
    setIsDialogOpen(true);
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
          <h2 className="text-2xl font-bold tracking-tight">Locales</h2>
          <p className="text-muted-foreground">Administre los puntos de venta y los productos disponibles en cada uno.</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo local
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nombre, código o marca..." className="pl-9"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <Select value={marcaFilter} onValueChange={setMarcaFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Marca" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas las marcas</SelectItem>
            {marcas?.map((m) => (
              <SelectItem key={m.id} value={m.id.toString()}>{m.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(searchTerm || marcaFilter !== "todos") && (
          <Button variant="ghost" onClick={() => { setSearchTerm(""); setMarcaFilter("todos"); }}>
            <FilterX className="mr-2 h-4 w-4" /> Limpiar
          </Button>
        )}
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead>Sociedad</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead className="text-center">Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((local) => (
              <TableRow key={local.id}>
                <TableCell className="font-medium">{local.nombre}</TableCell>
                <TableCell>{local.codigo || "-"}</TableCell>
                <TableCell>{local.marcaNombre || "-"}</TableCell>
                <TableCell>{local.sociedadNombre || "-"}</TableCell>
                <TableCell>
                  <div className="flex flex-col text-xs">
                    <span>{local.correo || "-"}</span>
                    <span className="text-muted-foreground">{local.telefono || "-"}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {local.activo ? (
                    <div className="flex items-center justify-center text-green-600">
                      <CheckCircle2 className="h-4 w-4 mr-1" /><span className="text-xs">Activo</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center text-muted-foreground">
                      <XCircle className="h-4 w-4 mr-1" /><span className="text-xs">Inactivo</span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" title="Productos del local"
                      onClick={() => setProductosLocal(local)}>
                      <Package className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(local)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeletingLocal(local)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">No hay locales registrados.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingLocal ? "Editar local" : "Nuevo local"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField control={form.control} name="nombre" render={({ field }) => (
                <FormItem><FormLabel>Nombre</FormLabel>
                  <FormControl><Input placeholder="Ej: GHF Escazú" {...field} /></FormControl>
                  <FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="codigo" render={({ field }) => (
                <FormItem><FormLabel>Código</FormLabel>
                  <FormControl><Input placeholder="ESC-01" {...field} value={field.value || ""} /></FormControl>
                  <FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="marcaId" render={({ field }) => (
                  <FormItem><FormLabel>Marca</FormLabel>
                    <Select onValueChange={(v) => field.onChange(v === "null" ? null : Number(v))}
                      value={field.value?.toString() || "null"}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="null">Ninguna</SelectItem>
                        {marcas?.map((m) => <SelectItem key={m.id} value={m.id.toString()}>{m.nombre}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="sociedadId" render={({ field }) => (
                  <FormItem><FormLabel>Sociedad</FormLabel>
                    <Select onValueChange={(v) => field.onChange(v === "null" ? null : Number(v))}
                      value={field.value?.toString() || "null"}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="null">Ninguna</SelectItem>
                        {sociedades?.map((s) => <SelectItem key={s.id} value={s.id.toString()}>{s.nombre}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="correo" render={({ field }) => (
                  <FormItem><FormLabel>Correo</FormLabel>
                    <FormControl><Input type="email" placeholder="local@ghf.com" {...field} value={field.value || ""} /></FormControl>
                    <FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="telefono" render={({ field }) => (
                  <FormItem><FormLabel>Teléfono</FormLabel>
                    <FormControl><Input placeholder="2222-2222" {...field} value={field.value || ""} /></FormControl>
                    <FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="direccion" render={({ field }) => (
                <FormItem><FormLabel>Dirección</FormLabel>
                  <FormControl><Input placeholder="Distrito, Cantón, Provincia" {...field} value={field.value || ""} /></FormControl>
                  <FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="activo" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5"><FormLabel>Activo</FormLabel></div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingLocal ? "Guardar cambios" : "Crear local"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Productos por Local Dialog */}
      <Dialog open={!!productosLocal} onOpenChange={(open) => !open && setProductosLocal(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Productos habilitados — {productosLocal?.nombre}
            </DialogTitle>
          </DialogHeader>
          <Separator />
          {productosLocal && <ProductosLocalPanel localId={productosLocal.id} />}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deletingLocal} onOpenChange={(open) => !open && setDeletingLocal(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el local <strong>{deletingLocal?.nombre}</strong>. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate({ id: deletingLocal.id })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
