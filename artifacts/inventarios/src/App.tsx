import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AppLayout } from "@/components/layout/app-layout";

import Login from "@/pages/login";

import Dashboard from "@/pages/dashboard";
import Sociedades from "@/pages/sociedades";
import Marcas from "@/pages/marcas";
import Locales from "@/pages/locales";
import Usuarios from "@/pages/usuarios";
import Categorias from "@/pages/categorias";
import Productos from "@/pages/productos";
import Stock from "@/pages/stock";
import Movimientos from "@/pages/movimientos";
import Pedidos from "@/pages/pedidos";
import Facturas from "@/pages/facturas";
import Catalogo from "@/pages/catalogo";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      <Route path="/(.*)">
        <AppLayout>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/sociedades" component={Sociedades} />
            <Route path="/marcas" component={Marcas} />
            <Route path="/locales" component={Locales} />
            <Route path="/usuarios" component={Usuarios} />
            <Route path="/categorias" component={Categorias} />
            <Route path="/productos" component={Productos} />
            <Route path="/stock" component={Stock} />
            <Route path="/stock/movimientos" component={Movimientos} />
            <Route path="/pedidos" component={Pedidos} />
            <Route path="/facturas" component={Facturas} />
            <Route path="/facturas/nueva">
              {() => <Catalogo mode="factura" />}
            </Route>
            <Route path="/catalogo">
              {() => <Catalogo mode="pedido" />}
            </Route>
            <Route component={NotFound} />
          </Switch>
        </AppLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
