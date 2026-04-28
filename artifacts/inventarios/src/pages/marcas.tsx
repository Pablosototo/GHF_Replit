import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListMarcas, 
  useCreateMarca, 
  useUpdateMarca, 
  useDeleteMarca,
  getListMarcasQueryKey
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Plus, 
  Pencil, 
  Trash2,
  CheckCircle2,
  XCircle
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

const marcaSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  slug: z.string().optional().nullable(),
  activo: z.boolean().default(true),
});

type MarcaFormValues = z.infer<typeof marcaSchema>;

export default function Marcas() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: marcas, isLoading } = useListMarcas();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMarca, setEditingMarca] = useState<any>(null);
  const [deletingMarca, setDeletingMarca] = useState<any>(null);

  const form = useForm<MarcaFormValues>({
    resolver: zodResolver(marcaSchema),
    defaultValues: {
      nombre: "",
      slug: "",
      activo: true,
    },
  });

  const createMutation = useCreateMarca({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMarcasQueryKey() });
        toast({ title: "Guardado", description: "La marca ha sido creada exitosamente." });
        setIsDialogOpen(false);
        form.reset();
      },
      onError: (error: any) => {
        toast({ variant: "destructive", title: "Error", description: error.message });
      },
    },
  });

  const updateMutation = useUpdateMarca({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMarcasQueryKey() });
        toast({ title: "Actualizado", description: "La marca ha sido actualizada exitosamente." });
        setIsDialogOpen(false);
        setEditingMarca(null);
        form.reset();
      },
      onError: (error: any) => {
        toast({ variant: "destructive", title: "Error", description: error.message });
      },
    },
  });

  const deleteMutation = useDeleteMarca({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMarcasQueryKey() });
        toast({ title: "Eliminado", description: "La marca ha sido eliminada." });
        setDeletingMarca(null);
      },
      onError: (error: any) => {
        toast({ variant: "destructive", title: "Error", description: error.message });
      },
    },
  });

  const onSubmit = (values: MarcaFormValues) => {
    if (editingMarca) {
      updateMutation.mutate({ id: editingMarca.id, data: values });
    } else {
      createMutation.mutate({ data: values });
    }
  };

  const handleEdit = (marca: any) => {
    setEditingMarca(marca);
    form.reset({
      nombre: marca.nombre,
      slug: marca.slug || "",
      activo: marca.activo,
    });
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingMarca(null);
    form.reset({
      nombre: "",
      slug: "",
      activo: true,
    });
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
          <h2 className="text-2xl font-bold tracking-tight">Marcas</h2>
          <p className="text-muted-foreground">Gestione las marcas comerciales de sus productos.</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" /> Nueva marca
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="text-center"># Locales</TableHead>
              <TableHead className="text-center">Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {marcas?.map((marca) => (
              <TableRow key={marca.id}>
                <TableCell className="font-medium">{marca.nombre}</TableCell>
                <TableCell>{marca.slug || "-"}</TableCell>
                <TableCell className="text-center">{marca.localesCount}</TableCell>
                <TableCell className="text-center">
                  {marca.activo ? (
                    <div className="flex items-center justify-center text-green-600">
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      <span className="text-xs">Activo</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center text-muted-foreground">
                      <XCircle className="h-4 w-4 mr-1" />
                      <span className="text-xs">Inactivo</span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(marca)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeletingMarca(marca)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {marcas?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No hay marcas registradas.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingMarca ? "Editar marca" : "Nueva marca"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Marca Premium" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug (identificador)</FormLabel>
                    <FormControl>
                      <Input placeholder="ej-marca-premium" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="activo"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Activa</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingMarca ? "Guardar cambios" : "Crear marca"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingMarca} onOpenChange={(open) => !open && setDeletingMarca(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la marca <strong>{deletingMarca?.nombre}</strong>. 
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteMutation.mutate({ id: deletingMarca.id })}
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
