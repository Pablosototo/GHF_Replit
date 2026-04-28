import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListSociedades, 
  useCreateSociedad, 
  useUpdateSociedad, 
  useDeleteSociedad,
  getListSociedadesQueryKey
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
  DialogTrigger,
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Plus, 
  Pencil, 
  Trash2, 
  Building,
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

const sociedadSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  cedulaJuridica: z.string().optional().nullable(),
  correo: z.string().email("Correo inválido").optional().nullable().or(z.literal("")),
  telefono: z.string().optional().nullable(),
  direccion: z.string().optional().nullable(),
  activo: z.boolean().default(true),
});

type SociedadFormValues = z.infer<typeof sociedadSchema>;

export default function Sociedades() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: sociedades, isLoading } = useListSociedades();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSociedad, setEditingSociedad] = useState<any>(null);
  const [deletingSociedad, setDeletingSociedad] = useState<any>(null);

  const form = useForm<SociedadFormValues>({
    resolver: zodResolver(sociedadSchema),
    defaultValues: {
      nombre: "",
      cedulaJuridica: "",
      correo: "",
      telefono: "",
      direccion: "",
      activo: true,
    },
  });

  const createMutation = useCreateSociedad({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSociedadesQueryKey() });
        toast({ title: "Guardado", description: "La sociedad ha sido creada exitosamente." });
        setIsDialogOpen(false);
        form.reset();
      },
      onError: (error: any) => {
        toast({ variant: "destructive", title: "Error", description: error.message });
      },
    },
  });

  const updateMutation = useUpdateSociedad({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSociedadesQueryKey() });
        toast({ title: "Actualizado", description: "La sociedad ha sido actualizada exitosamente." });
        setIsDialogOpen(false);
        setEditingSociedad(null);
        form.reset();
      },
      onError: (error: any) => {
        toast({ variant: "destructive", title: "Error", description: error.message });
      },
    },
  });

  const deleteMutation = useDeleteSociedad({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSociedadesQueryKey() });
        toast({ title: "Eliminado", description: "La sociedad ha sido eliminada." });
        setDeletingSociedad(null);
      },
      onError: (error: any) => {
        toast({ variant: "destructive", title: "Error", description: error.message });
      },
    },
  });

  const onSubmit = (values: SociedadFormValues) => {
    if (editingSociedad) {
      updateMutation.mutate({ id: editingSociedad.id, data: values });
    } else {
      createMutation.mutate({ data: values });
    }
  };

  const handleEdit = (sociedad: any) => {
    setEditingSociedad(sociedad);
    form.reset({
      nombre: sociedad.nombre,
      cedulaJuridica: sociedad.cedulaJuridica || "",
      correo: sociedad.correo || "",
      telefono: sociedad.telefono || "",
      direccion: sociedad.direccion || "",
      activo: sociedad.activo,
    });
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingSociedad(null);
    form.reset({
      nombre: "",
      cedulaJuridica: "",
      correo: "",
      telefono: "",
      direccion: "",
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
          <h2 className="text-2xl font-bold tracking-tight">Sociedades</h2>
          <p className="text-muted-foreground">Administre las entidades legales de su organización.</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" /> Nueva sociedad
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Cédula Jurídica</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead className="text-center">Locales</TableHead>
              <TableHead className="text-center">Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sociedades?.map((sociedad) => (
              <TableRow key={sociedad.id}>
                <TableCell className="font-medium">{sociedad.nombre}</TableCell>
                <TableCell>{sociedad.cedulaJuridica || "-"}</TableCell>
                <TableCell>{sociedad.correo || "-"}</TableCell>
                <TableCell>{sociedad.telefono || "-"}</TableCell>
                <TableCell className="text-center">{sociedad.localesCount}</TableCell>
                <TableCell className="text-center">
                  {sociedad.activo ? (
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
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(sociedad)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeletingSociedad(sociedad)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {sociedades?.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No hay sociedades registradas.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingSociedad ? "Editar sociedad" : "Nueva sociedad"}</DialogTitle>
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
                      <Input placeholder="Ej: Corporación GHF S.A." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cedulaJuridica"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cédula Jurídica</FormLabel>
                    <FormControl>
                      <Input placeholder="3-101-XXXXXX" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="correo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="admin@empresa.com" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="telefono"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input placeholder="2222-2222" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="direccion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input placeholder="San José, Costa Rica" {...field} value={field.value || ""} />
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
                      <FormLabel>Activo</FormLabel>
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
                  {editingSociedad ? "Guardar cambios" : "Crear sociedad"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingSociedad} onOpenChange={(open) => !open && setDeletingSociedad(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la sociedad <strong>{deletingSociedad?.nombre}</strong>. 
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteMutation.mutate({ id: deletingSociedad.id })}
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
