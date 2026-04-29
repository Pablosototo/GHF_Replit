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
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, Plus, Pencil, Trash2, CheckCircle2, XCircle, Search, FilterX
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";

const categoriaSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().optional().nullable(),
  impuestoPct: z.coerce.number().min(0).max(100).default(13),
  activo: z.boolean().default(true),
});

type CategoriaFormValues = z.infer<typeof categoriaSchema>;

export default function Categorias() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: categorias, isLoading } = useListCategorias();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<any>(null);
  const [deletingCategoria, setDeletingCategoria] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

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
          <p className="text-muted-foreground">Organice sus productos por categorías y defina el impuesto aplicable.</p>
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
