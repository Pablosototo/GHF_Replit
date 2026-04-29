import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  useListProductos, 
  useCreateProducto, 
  useUpdateProducto, 
  useDeleteProducto,
  useListCategorias,
  getListProductosQueryKey
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Plus, 
  Pencil, 
  Trash2,
  CheckCircle2,
  XCircle,
  Search,
  FilterX
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
import { formatCurrency } from "@/lib/utils";

const productoSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  sku: z.string().optional().nullable(),
  categoriaId: z.coerce.number().optional().nullable(),
  descripcion: z.string().optional().nullable(),
  precio: z.coerce.number().min(0, "El precio debe ser mayor o igual a 0"),
  stockMinimo: z.coerce.number().int().min(0, "El stock mínimo debe ser mayor o igual a 0").optional().default(0),
  activo: z.boolean().default(true),
});

type ProductoFormValues = z.infer<typeof productoSchema>;

export default function Productos() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [categoriaFilter, setCategoriaFilter] = useState(searchParams.get("categoriaId") || "all");
  
  const { data: productos, isLoading } = useListProductos({
    search: searchTerm || undefined,
    categoriaId: categoriaFilter !== "all" ? Number(categoriaFilter) : undefined,
  });
  
  const { data: categorias } = useListCategorias();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProducto, setEditingProducto] = useState<any>(null);
  const [deletingProducto, setDeletingProducto] = useState<any>(null);

  const form = useForm<ProductoFormValues>({
    resolver: zodResolver(productoSchema),
    defaultValues: {
      nombre: "",
      sku: "",
      categoriaId: null,
      descripcion: "",
      precio: 0,
      stockMinimo: 0,
      activo: true,
    },
  });

  const createMutation = useCreateProducto({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductosQueryKey() });
        toast({ title: "Guardado", description: "El producto ha sido creado exitosamente." });
        setIsDialogOpen(false);
        form.reset();
      },
      onError: (error: any) => {
        toast({ variant: "destructive", title: "Error", description: error.message });
      },
    },
  });

  const updateMutation = useUpdateProducto({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductosQueryKey() });
        toast({ title: "Actualizado", description: "El producto ha sido actualizado exitosamente." });
        setIsDialogOpen(false);
        setEditingProducto(null);
        form.reset();
      },
      onError: (error: any) => {
        toast({ variant: "destructive", title: "Error", description: error.message });
      },
    },
  });

  const deleteMutation = useDeleteProducto({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductosQueryKey() });
        toast({ title: "Eliminado", description: "El producto ha sido eliminado." });
        setDeletingProducto(null);
      },
      onError: (error: any) => {
        toast({ variant: "destructive", title: "Error", description: error.message });
      },
    },
  });

  const onSubmit = (values: ProductoFormValues) => {
    if (editingProducto) {
      updateMutation.mutate({ id: editingProducto.id, data: values });
    } else {
      createMutation.mutate({ data: values });
    }
  };

  const handleEdit = (producto: any) => {
    setEditingProducto(producto);
    form.reset({
      nombre: producto.nombre,
      sku: producto.sku || "",
      categoriaId: producto.categoriaId || null,
      descripcion: producto.descripcion || "",
      precio: producto.precio,
      stockMinimo: producto.stockMinimo,
      activo: producto.activo,
    });
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingProducto(null);
    form.reset({
      nombre: "",
      sku: "",
      categoriaId: null,
      descripcion: "",
      precio: 0,
      stockMinimo: 0,
      activo: true,
    });
    setIsDialogOpen(true);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setCategoriaFilter("all");
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
          <h2 className="text-2xl font-bold tracking-tight">Productos</h2>
          <p className="text-muted-foreground">Catálogo completo de productos y servicios.</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo producto
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nombre o SKU..." 
            className="pl-9" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-[200px]">
          <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categorias?.map((cat) => (
                <SelectItem key={cat.id} value={cat.id.toString()}>{cat.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {(searchTerm || categoriaFilter !== "all") && (
          <Button variant="ghost" onClick={clearFilters}>
            <FilterX className="mr-2 h-4 w-4" /> Limpiar
          </Button>
        )}
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead className="text-center">Stock Mín.</TableHead>
              <TableHead className="text-center">Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productos?.map((producto) => (
              <TableRow key={producto.id}>
                <TableCell className="font-mono text-xs">{producto.sku || "-"}</TableCell>
                <TableCell className="font-medium">{producto.nombre}</TableCell>
                <TableCell>{producto.categoriaNombre || "-"}</TableCell>
                <TableCell className="text-right">{formatCurrency(producto.precio)}</TableCell>
                <TableCell className="text-center">{producto.stockMinimo}</TableCell>
                <TableCell className="text-center">
                  {producto.activo ? (
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
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(producto)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeletingProducto(producto)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {productos?.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No se encontraron productos.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingProducto ? "Editar producto" : "Nuevo producto"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU / Código</FormLabel>
                      <FormControl>
                        <Input placeholder="PROD-001" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="categoriaId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría</FormLabel>
                      <Select 
                        onValueChange={(val) => field.onChange(val === "null" ? null : Number(val))} 
                        value={field.value?.toString() || "null"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="null">Ninguna</SelectItem>
                          {categorias?.map((c) => (
                            <SelectItem key={c.id} value={c.id.toString()}>{c.nombre}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del producto</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Café Chorotega 500g" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="descripcion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Opcional..." {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="precio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio Venta</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="stockMinimo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Mín.</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="activo"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Disponible para venta</FormLabel>
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
                  {editingProducto ? "Guardar cambios" : "Crear producto"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingProducto} onOpenChange={(open) => !open && setDeletingProducto(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el producto <strong>{deletingProducto?.nombre}</strong> de forma permanente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteMutation.mutate({ id: deletingProducto.id })}
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
