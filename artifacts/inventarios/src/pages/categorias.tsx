import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListCategorias, 
  useCreateCategoria, 
  useUpdateCategoria, 
  useDeleteCategoria,
  getListCategoriasQueryKey
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, Plus, Pencil, Trash2, CheckCircle2, XCircle, Search, FilterX, Clock, X
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const categoriaSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().optional().nullable(),
  impuestoPct: z.coerce.number().min(0).max(100).default(13),
  activo: z.boolean().default(true),
});

type CategoriaFormValues = z.infer<typeof categoriaSchema>;

interface Horario {
  id: number;
  categoriaId: number;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  activo: boolean;
}

function HorariosPanel({ categoriaId }: { categoriaId: number }) {
  const { toast } = useToast();
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newHorario, setNewHorario] = useState({ diaSemana: "1", horaInicio: "08:00", horaFin: "18:00" });

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/categorias/${categoriaId}/horarios`);
      setHorarios(await r.json());
    } finally {
      setLoading(false);
    }
  };

  useState(() => { load(); });

  const handleAdd = async () => {
    try {
      const r = await fetch(`/api/categorias/${categoriaId}/horarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newHorario, diaSemana: Number(newHorario.diaSemana) }),
      });
      if (!r.ok) throw new Error();
      toast({ title: "Horario agregado" });
      setAdding(false);
      load();
    } catch {
      toast({ variant: "destructive", title: "Error al agregar horario" });
    }
  };

  const handleDelete = async (hid: number) => {
    await fetch(`/api/categorias/${categoriaId}/horarios/${hid}`, { method: "DELETE" });
    load();
  };

  const handleToggle = async (h: Horario) => {
    await fetch(`/api/categorias/${categoriaId}/horarios/${h.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...h, activo: !h.activo }),
    });
    load();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Define los días y horarios en que esta categoría (y sus productos) está disponible para pedidos.
          Sin horarios configurados, siempre está disponible.
        </p>
        <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
          <Plus className="h-3 w-3 mr-1" /> Agregar
        </Button>
      </div>

      {adding && (
        <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
          <p className="text-sm font-medium">Nuevo horario</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Día</label>
              <Select value={newHorario.diaSemana} onValueChange={(v) => setNewHorario(h => ({ ...h, diaSemana: v }))}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIAS.map((d, i) => (
                    <SelectItem key={i} value={String(i)}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Desde</label>
              <Input className="h-8 text-sm" type="time" value={newHorario.horaInicio}
                onChange={e => setNewHorario(h => ({ ...h, horaInicio: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Hasta</label>
              <Input className="h-8 text-sm" type="time" value={newHorario.horaFin}
                onChange={e => setNewHorario(h => ({ ...h, horaFin: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd}>Guardar</Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : horarios.length === 0 ? (
        <p className="text-sm text-center text-muted-foreground py-4">Sin horarios — disponible siempre.</p>
      ) : (
        <div className="space-y-2">
          {horarios.map(h => (
            <div key={h.id} className="flex items-center justify-between border rounded-lg px-4 py-2 bg-background">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{DIAS[h.diaSemana]}</span>
                <span className="text-sm text-muted-foreground">{h.horaInicio} – {h.horaFin}</span>
                {!h.activo && <Badge variant="outline" className="text-xs text-muted-foreground">Desactivado</Badge>}
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={h.activo} onCheckedChange={() => handleToggle(h)} />
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(h.id)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Categorias() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: categorias, isLoading } = useListCategorias();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<any>(null);
  const [deletingCategoria, setDeletingCategoria] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [horariosCategoria, setHorariosCategoria] = useState<any>(null);

  const filtered = categorias?.filter(c =>
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  ) ?? [];

  const form = useForm<CategoriaFormValues>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: { nombre: "", descripcion: "", impuestoPct: 13, activo: true },
  });

  const createMutation = useCreateCategoria({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCategoriasQueryKey() });
        toast({ title: "Guardado", description: "Categoría creada exitosamente." });
        setIsDialogOpen(false);
        form.reset();
      },
      onError: (error: any) => toast({ variant: "destructive", title: "Error", description: error.message }),
    },
  });

  const updateMutation = useUpdateCategoria({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCategoriasQueryKey() });
        toast({ title: "Actualizado", description: "Categoría actualizada exitosamente." });
        setIsDialogOpen(false);
        setEditingCategoria(null);
        form.reset();
      },
      onError: (error: any) => toast({ variant: "destructive", title: "Error", description: error.message }),
    },
  });

  const deleteMutation = useDeleteCategoria({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCategoriasQueryKey() });
        toast({ title: "Eliminado", description: "Categoría eliminada." });
        setDeletingCategoria(null);
      },
      onError: (error: any) => toast({ variant: "destructive", title: "Error", description: error.message }),
    },
  });

  const onSubmit = (values: CategoriaFormValues) => {
    if (editingCategoria) {
      updateMutation.mutate({ id: editingCategoria.id, data: values as any });
    } else {
      createMutation.mutate({ data: values as any });
    }
  };

  const handleEdit = (categoria: any) => {
    setEditingCategoria(categoria);
    form.reset({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion || "",
      impuestoPct: (categoria as any).impuestoPct ?? 13,
      activo: categoria.activo,
    });
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingCategoria(null);
    form.reset({ nombre: "", descripcion: "", impuestoPct: 13, activo: true });
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
          <h2 className="text-2xl font-bold tracking-tight">Categorías</h2>
          <p className="text-muted-foreground">Organice sus productos por categorías y defina el impuesto y horarios de disponibilidad.</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" /> Nueva categoría
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nombre..." className="pl-9" value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        {searchTerm && (
          <Button variant="ghost" onClick={() => setSearchTerm("")}>
            <FilterX className="mr-2 h-4 w-4" /> Limpiar
          </Button>
        )}
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead className="text-center">Impuesto</TableHead>
              <TableHead className="text-center"># Productos</TableHead>
              <TableHead className="text-center">Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((categoria) => (
              <TableRow key={categoria.id}>
                <TableCell className="font-medium">{categoria.nombre}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary">{(categoria as any).impuestoPct ?? 13}%</Badge>
                </TableCell>
                <TableCell className="text-center">{categoria.productosCount}</TableCell>
                <TableCell className="text-center">
                  {categoria.activo ? (
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
                    <Button variant="ghost" size="icon" title="Horarios de disponibilidad"
                      onClick={() => setHorariosCategoria(categoria)}>
                      <Clock className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(categoria)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeletingCategoria(categoria)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">No hay categorías registradas.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingCategoria ? "Editar categoría" : "Nueva categoría"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField control={form.control} name="nombre" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl><Input placeholder="Ej: Bebidas, Verduras, etc." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="impuestoPct" render={({ field }) => (
                <FormItem>
                  <FormLabel>Impuesto (%)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" max="100" placeholder="13" {...field} />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">Ej: 13 para IVA estándar, 1 para productos con tarifa reducida</p>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="activo" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5"><FormLabel>Activa</FormLabel></div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingCategoria ? "Guardar cambios" : "Crear categoría"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Horarios Dialog */}
      <Dialog open={!!horariosCategoria} onOpenChange={(open) => !open && setHorariosCategoria(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horarios de disponibilidad — {horariosCategoria?.nombre}
            </DialogTitle>
          </DialogHeader>
          <Separator />
          {horariosCategoria && <HorariosPanel categoriaId={horariosCategoria.id} />}
          <DialogFooter>
            <Button variant="outline" onClick={() => setHorariosCategoria(null)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deletingCategoria} onOpenChange={(open) => !open && setDeletingCategoria(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la categoría <strong>{deletingCategoria?.nombre}</strong>. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate({ id: deletingCategoria.id })}
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
