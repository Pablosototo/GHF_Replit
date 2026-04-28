import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListUsuarios, 
  useCreateUsuario, 
  useUpdateUsuario, 
  useDeleteUsuario,
  useListLocales,
  useGetMe,
  getListUsuariosQueryKey
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
  Pencil, 
  Trash2,
  Users,
  ShieldCheck,
  Store,
  AlertCircle
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const usuarioSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  username: z.string().min(3, "El usuario debe tener al menos 3 caracteres"),
  email: z.string().email("Correo inválido").optional().nullable().or(z.literal("")),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").optional().or(z.literal("")),
  role: z.enum(["admin", "local"]),
  localId: z.coerce.number().optional().nullable(),
}).refine(data => {
  if (data.role === "local" && !data.localId) {
    return false;
  }
  return true;
}, {
  message: "Debe seleccionar un local para el rol 'local'",
  path: ["localId"]
});

type UsuarioFormValues = z.infer<typeof usuarioSchema>;

export default function Usuarios() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: me } = useGetMe();
  
  const { data: usuarios, isLoading } = useListUsuarios();
  const { data: locales } = useListLocales();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<any>(null);
  const [deletingUsuario, setDeletingUsuario] = useState<any>(null);

  const form = useForm<UsuarioFormValues>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      role: "local",
      localId: null,
    },
  });

  const createMutation = useCreateUsuario({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListUsuariosQueryKey() });
        toast({ title: "Guardado", description: "El usuario ha sido creado exitosamente." });
        setIsDialogOpen(false);
        form.reset();
      },
      onError: (error: any) => {
        toast({ variant: "destructive", title: "Error", description: error.message });
      },
    },
  });

  const updateMutation = useUpdateUsuario({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListUsuariosQueryKey() });
        toast({ title: "Actualizado", description: "El usuario ha sido actualizado exitosamente." });
        setIsDialogOpen(false);
        setEditingUsuario(null);
        form.reset();
      },
      onError: (error: any) => {
        toast({ variant: "destructive", title: "Error", description: error.message });
      },
    },
  });

  const deleteMutation = useDeleteUsuario({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListUsuariosQueryKey() });
        toast({ title: "Eliminado", description: "El usuario ha sido eliminado." });
        setDeletingUsuario(null);
      },
      onError: (error: any) => {
        toast({ variant: "destructive", title: "Error", description: error.message });
      },
    },
  });

  const onSubmit = (values: UsuarioFormValues) => {
    // If editing and password is empty, don't send it
    const data = { ...values };
    if (editingUsuario && !data.password) {
      delete (data as any).password;
    }

    if (editingUsuario) {
      updateMutation.mutate({ id: editingUsuario.id, data: data as any });
    } else {
      if (!data.password) {
        form.setError("password", { message: "La contraseña es requerida para nuevos usuarios" });
        return;
      }
      createMutation.mutate({ data: data as any });
    }
  };

  const handleEdit = (usuario: any) => {
    setEditingUsuario(usuario);
    form.reset({
      name: usuario.name,
      username: usuario.username,
      email: usuario.email || "",
      password: "", // Always empty when editing unless changing
      role: usuario.role,
      localId: usuario.localId || null,
    });
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingUsuario(null);
    form.reset({
      name: "",
      username: "",
      email: "",
      password: "",
      role: "local",
      localId: null,
    });
    setIsDialogOpen(true);
  };

  if (me && me.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acceso denegado</AlertTitle>
          <AlertDescription>
            No tiene permisos de administrador para acceder a esta página.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

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
          <h2 className="text-2xl font-bold tracking-tight">Usuarios</h2>
          <p className="text-muted-foreground">Gestione el acceso al sistema y roles.</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo usuario
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Local</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios?.map((usuario) => (
              <TableRow key={usuario.id}>
                <TableCell className="font-medium">{usuario.name}</TableCell>
                <TableCell className="font-mono text-sm">{usuario.username}</TableCell>
                <TableCell>{usuario.email || "-"}</TableCell>
                <TableCell>
                  <Badge variant={usuario.role === "admin" ? "default" : "outline"} className="capitalize">
                    {usuario.role === "admin" ? <ShieldCheck className="h-3 w-3 mr-1" /> : <Users className="h-3 w-3 mr-1" />}
                    {usuario.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  {usuario.localNombre ? (
                    <div className="flex items-center text-xs">
                      <Store className="h-3 w-3 mr-1 text-muted-foreground" />
                      {usuario.localNombre}
                    </div>
                  ) : "-"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(usuario)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive" 
                      onClick={() => setDeletingUsuario(usuario)}
                      disabled={usuario.id === me?.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {usuarios?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No hay usuarios registrados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingUsuario ? "Editar usuario" : "Nuevo usuario"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Maria Lopez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Usuario</FormLabel>
                      <FormControl>
                        <Input placeholder="mlopez" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="mlopez@ghf.com" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{editingUsuario ? "Cambiar contraseña (opcional)" : "Contraseña"}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rol</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione rol" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="local">Operador Local</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="localId"
                  render={({ field }) => (
                    <FormItem className={form.watch("role") === "admin" ? "opacity-50 pointer-events-none" : ""}>
                      <FormLabel>Local asignado</FormLabel>
                      <Select 
                        onValueChange={(val) => field.onChange(val === "null" ? null : Number(val))} 
                        value={field.value?.toString() || "null"}
                        disabled={form.watch("role") === "admin"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione local..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="null">Ninguno</SelectItem>
                          {locales?.map((l) => (
                            <SelectItem key={l.id} value={l.id.toString()}>{l.nombre}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingUsuario ? "Guardar cambios" : "Crear usuario"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingUsuario} onOpenChange={(open) => !open && setDeletingUsuario(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente al usuario <strong>{deletingUsuario?.name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteMutation.mutate({ id: deletingUsuario.id })}
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
