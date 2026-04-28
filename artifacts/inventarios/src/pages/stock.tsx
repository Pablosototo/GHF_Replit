import { useState } from "react";
import { 
  useListStock, 
  useListLocales,
  useGetMe
} from "@workspace/api-client-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Search, 
  AlertTriangle,
  Boxes,
  CheckCircle2,
  XCircle,
  FilterX
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function Stock() {
  const { data: me } = useGetMe();
  const isAdmin = me?.role === "admin";
  
  const [searchTerm, setSearchTerm] = useState("");
  const [localFilter, setLocalFilter] = useState<string>(isAdmin ? "all" : (me?.localId?.toString() || "all"));
  
  const { data: stock, isLoading } = useListStock({
    search: searchTerm || undefined,
    localId: localFilter !== "all" ? Number(localFilter) : undefined,
  });
  
  const { data: locales } = useListLocales();

  const stockBajoCount = stock?.filter(s => s.estado === "bajo" || s.estado === "agotado").length || 0;

  const clearFilters = () => {
    setSearchTerm("");
    if (isAdmin) setLocalFilter("all");
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
          <h2 className="text-2xl font-bold tracking-tight">Estado de Stock</h2>
          <p className="text-muted-foreground">Monitoree los niveles de inventario por local.</p>
        </div>
      </div>

      {stockBajoCount > 0 && (
        <Card className="bg-destructive/10 border-destructive/20">
          <CardContent className="flex items-center gap-4 py-4">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <div className="flex-1">
              <p className="font-semibold text-destructive">Atención: Stock crítico detectado</p>
              <p className="text-sm text-destructive/80">
                Hay {stockBajoCount} productos con stock bajo o agotado. Por favor, realice los movimientos de reposición necesarios.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar producto o SKU..." 
            className="pl-9" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {isAdmin && (
          <div className="w-full sm:w-[200px]">
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
        {(searchTerm || (isAdmin && localFilter !== "all")) && (
          <Button variant="ghost" onClick={clearFilters}>
            <FilterX className="mr-2 h-4 w-4" /> Limpiar
          </Button>
        )}
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Local</TableHead>
              <TableHead className="text-center">Cantidad</TableHead>
              <TableHead className="text-center">Mínimo</TableHead>
              <TableHead className="text-center">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stock?.map((item) => (
              <TableRow key={`${item.localId}-${item.productoId}`}>
                <TableCell className="font-medium">{item.productoNombre}</TableCell>
                <TableCell className="font-mono text-xs">{item.sku || "-"}</TableCell>
                <TableCell>{item.categoriaNombre || "-"}</TableCell>
                <TableCell>{item.localNombre}</TableCell>
                <TableCell className="text-center font-bold">
                  <span className={cn(
                    item.estado === "bajo" ? "text-yellow-600" : 
                    item.estado === "agotado" ? "text-destructive" : ""
                  )}>
                    {item.cantidad}
                  </span>
                </TableCell>
                <TableCell className="text-center text-muted-foreground">{item.stockMinimo}</TableCell>
                <TableCell className="text-center">
                  {item.estado === "ok" ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> OK
                    </Badge>
                  ) : item.estado === "bajo" ? (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      <AlertTriangle className="h-3 w-3 mr-1" /> BAJO
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" /> AGOTADO
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {stock?.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <Boxes className="h-8 w-8 text-muted-foreground/30" />
                    <span>No hay registros de stock que coincidan.</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
