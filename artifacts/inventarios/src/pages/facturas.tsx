import { useState } from "react";
import { Link } from "wouter";
import { 
  useListFacturas, 
  useGetFactura,
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
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from "@/components/ui/dialog";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, 
  Receipt,
  Printer,
  Eye,
  FileText,
  FilePlus2,
  Search,
  FilterX
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export default function Facturas() {
  const { data: me } = useGetMe();
  const isAdmin = me?.role === "admin";
  
  const [estadoFilter, setEstadoFilter] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFacturaId, setSelectedFacturaId] = useState<number | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { data: facturas, isLoading } = useListFacturas({
    estado: estadoFilter === "todos" ? undefined : estadoFilter,
    localId: isAdmin ? undefined : me?.localId || undefined,
  });
  
  const { data: detailFactura, isLoading: isDetailLoading } = useGetFactura(selectedFacturaId || 0);

  const { data: locales } = useListLocales();

  const filteredFacturas = facturas?.filter(f => {
    const term = searchTerm.toLowerCase();
    return !term ||
      (f.numeroFactura || "").toLowerCase().includes(term) ||
      (f.localNombre || "").toLowerCase().includes(term) ||
      (f.clienteNombre || "").toLowerCase().includes(term);
  }) ?? [];

  const handleOpenDetail = (id: number) => {
    setSelectedFacturaId(id);
    setIsDetailOpen(true);
  };

  const handlePrint = () => {
    window.print();
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
          <h2 className="text-2xl font-bold tracking-tight">Facturas</h2>
          <p className="text-muted-foreground">Historial de facturación y comprobantes.</p>
        </div>
        {isAdmin && (
          <Link href="/facturas/nueva">
            <Button>
              <FilePlus2 className="mr-2 h-4 w-4" />
              Nueva factura
            </Button>
          </Link>
        )}
      </div>

      <Tabs value={estadoFilter} onValueChange={setEstadoFilter} className="w-full">
        <TabsList>
          <TabsTrigger value="todos">Todas</TabsTrigger>
          <TabsTrigger value="valida">Válidas</TabsTrigger>
          <TabsTrigger value="anulada">Anuladas</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número, local o cliente..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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
              <TableHead>Número</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Cliente</TableHead>
              {isAdmin && <TableHead>Local</TableHead>}
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-center">Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFacturas.map((factura) => (
              <TableRow key={factura.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleOpenDetail(factura.id)}>
                <TableCell className="font-mono font-bold">{factura.numeroFactura}</TableCell>
                <TableCell className="text-xs">{formatDateTime(factura.fecha)}</TableCell>
                <TableCell className="font-medium">{factura.clienteNombre}</TableCell>
                {isAdmin && <TableCell>{factura.localNombre}</TableCell>}
                <TableCell className="text-right font-bold">{formatCurrency(factura.total)}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className={cn(
                    "capitalize",
                    factura.estado === "valida" ? "bg-green-50 text-green-700 border-green-200" :
                    "bg-red-50 text-red-700 border-red-200"
                  )}>
                    {factura.estado}
                  </Badge>
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDetail(factura.id)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => {
                      setSelectedFacturaId(factura.id);
                      setIsDetailOpen(true);
                      setTimeout(handlePrint, 500);
                    }}>
                      <Printer className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredFacturas.length === 0 && (
              <TableRow>
                <TableCell colSpan={isAdmin ? 7 : 6} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <Receipt className="h-8 w-8 text-muted-foreground/30" />
                    <span>No hay facturas registradas.</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl print-content p-0 overflow-hidden border-none shadow-none sm:border sm:shadow-lg sm:p-6">
          <div className="p-6 space-y-8 bg-white text-black">
            {isDetailLoading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : detailFactura ? (
              <div className="space-y-8 print:p-0">
                {/* Invoice Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-3xl font-black tracking-tighter uppercase mb-1">Factura</h1>
                    <p className="text-xl font-mono">{detailFactura.numeroFactura}</p>
                    <div className="mt-4 space-y-1 text-sm">
                      <p className="font-bold">{detailFactura.localNombre}</p>
                      <p className="text-muted-foreground">Fecha: {formatDateTime(detailFactura.fecha)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex flex-col items-end gap-2 mb-4">
                      <Badge variant="outline" className={cn(
                        "capitalize print:hidden",
                        detailFactura.estado === "valida" ? "bg-green-50 text-green-700 border-green-200" :
                        "bg-red-50 text-red-700 border-red-200"
                      )}>
                        {detailFactura.estado}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Cliente</p>
                      <p className="font-bold">{detailFactura.clienteNombre}</p>
                      <p className="text-xs">{detailFactura.clienteEmail}</p>
                      <p className="text-xs">{detailFactura.clienteTelefono}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Items Table */}
                <div className="overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50 border-y">
                      <TableRow>
                        <TableHead>Descripción</TableHead>
                        <TableHead className="text-center w-20">Cant.</TableHead>
                        <TableHead className="text-right w-32">Precio Unit.</TableHead>
                        <TableHead className="text-right w-32">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailFactura.detalles.map((det) => (
                        <TableRow key={det.id} className="border-b last:border-0">
                          <TableCell className="font-medium">{det.descripcion}</TableCell>
                          <TableCell className="text-center">{det.cantidad}</TableCell>
                          <TableCell className="text-right">{formatCurrency(det.precioUnitario)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(det.subtotal)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Totals Section */}
                <div className="flex justify-end pt-4">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">{formatCurrency(detailFactura.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Impuesto</span>
                      <span className="font-medium">{formatCurrency(detailFactura.impuesto)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-xl border-t pt-2 border-black">
                      <span>Total</span>
                      <span>{formatCurrency(detailFactura.total)}</span>
                    </div>
                  </div>
                </div>

                {detailFactura.observaciones && (
                  <div className="bg-muted/30 p-4 rounded text-sm italic">
                    <span className="font-semibold block not-italic text-xs text-muted-foreground uppercase mb-1">Notas:</span>
                    {detailFactura.observaciones}
                  </div>
                )}

                <div className="text-center text-[10px] text-muted-foreground pt-8 uppercase tracking-widest print:mt-12">
                  ¡Gracias por su compra!
                </div>
              </div>
            ) : null}
          </div>
          
          <DialogFooter className="p-6 bg-muted/20 border-t print:hidden">
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Cerrar</Button>
            <Button onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" /> Imprimir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .print-content, .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            border: none !important;
            box-shadow: none !important;
          }
          .print-hidden {
            display: none !important;
          }
        }
      `}} />
    </div>
  );
}
