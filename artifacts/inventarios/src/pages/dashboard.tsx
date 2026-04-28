import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, cn } from "@/lib/utils";
import { 
  useGetDashboardResumen, 
  useGetVentasPorDia, 
  useGetTopProductos, 
  useGetVentasPorLocal, 
  useGetStockBajo, 
  useGetActividadReciente
} from "@workspace/api-client-react";
import { Loader2, DollarSign, ShoppingCart, Receipt, Package, AlertTriangle, TrendingUp, Boxes } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: resumen, isLoading: isResumenLoading } = useGetDashboardResumen();
  const { data: ventasDia, isLoading: isVentasDiaLoading } = useGetVentasPorDia();
  const { data: topProductos, isLoading: isTopLoading } = useGetTopProductos();
  const { data: ventasLocal, isLoading: isVentasLocalLoading } = useGetVentasPorLocal();
  const { data: stockBajo, isLoading: isStockLoading } = useGetStockBajo({ limite: 5 });
  const { data: actividad, isLoading: isActividadLoading } = useGetActividadReciente();

  const isLoading = isResumenLoading || isVentasDiaLoading || isTopLoading || isVentasLocalLoading || isStockLoading || isActividadLoading;

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card className="hover-elevate transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(resumen?.ventasTotales || 0)}</div>
          </CardContent>
        </Card>
        <Card className="hover-elevate transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumen?.pedidosCount || 0}</div>
          </CardContent>
        </Card>
        <Card className="hover-elevate transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Facturas</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumen?.facturasCount || 0}</div>
          </CardContent>
        </Card>
        <Card className="hover-elevate transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(resumen?.ticketPromedio || 0)}</div>
          </CardContent>
        </Card>
        <Card className="hover-elevate transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumen?.productosCount || 0}</div>
          </CardContent>
        </Card>
        <Card className="hover-elevate transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Stock</CardTitle>
            <AlertTriangle className={cn("h-4 w-4", (resumen?.stockBajoCount || 0) > 0 ? "text-destructive" : "text-muted-foreground")} />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", (resumen?.stockBajoCount || 0) > 0 && "text-destructive")}>
              {resumen?.stockBajoCount || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Ventas en los últimos 30 días</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ventasDia || []} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="fecha" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: 'var(--radius)', border: '1px solid hsl(var(--border))' }}
                    formatter={(value: number) => [formatCurrency(value), "Ventas"]}
                  />
                  <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Ventas por Local</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ventasLocal || []} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                  <YAxis type="category" dataKey="localNombre" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} width={100} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: 'var(--radius)', border: '1px solid hsl(var(--border))' }}
                    formatter={(value: number) => [formatCurrency(value), "Ventas"]}
                  />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Top Productos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(topProductos || []).slice(0, 5).map((prod) => (
                <div key={prod.productoId} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{prod.productoNombre}</p>
                    <p className="text-xs text-muted-foreground">{prod.cantidadVendida} unidades vendidas</p>
                  </div>
                  <div className="font-medium text-sm">
                    {formatCurrency(prod.ingresos)}
                  </div>
                </div>
              ))}
              {(!topProductos || topProductos.length === 0) && (
                <div className="text-sm text-muted-foreground text-center py-4">No hay datos suficientes</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Alertas de Stock</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/stock">Ver todo</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(stockBajo || []).map((item, i) => (
                <div key={`${item.localId}-${item.productoId}`} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{item.productoNombre}</p>
                    <p className="text-xs text-muted-foreground">{item.localNombre}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-destructive">{item.cantidad} en stock</p>
                    <p className="text-xs text-muted-foreground">Mín: {item.stockMinimo}</p>
                  </div>
                </div>
              ))}
              {(!stockBajo || stockBajo.length === 0) && (
                <div className="flex flex-col items-center justify-center text-sm text-muted-foreground py-6 gap-2">
                  <Boxes className="h-8 w-8 text-muted-foreground/50" />
                  <p>Stock en niveles óptimos</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(actividad || []).map((act, i) => (
                <div key={i} className="flex items-center">
                  <div className={cn(
                    "w-2 h-2 rounded-full mr-3",
                    act.tipo === 'pedido' ? 'bg-blue-500' :
                    act.tipo === 'factura' ? 'bg-green-500' :
                    act.tipo === 'movimiento' ? 'bg-orange-500' : 'bg-gray-500'
                  )} />
                  <div className="space-y-1 flex-1">
                    <p className="text-sm font-medium leading-none">{act.titulo}</p>
                    <p className="text-xs text-muted-foreground">{act.subtitulo}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(act.createdAt).toLocaleDateString('es-CR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
              {(!actividad || actividad.length === 0) && (
                <div className="text-sm text-muted-foreground text-center py-4">No hay actividad reciente</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
