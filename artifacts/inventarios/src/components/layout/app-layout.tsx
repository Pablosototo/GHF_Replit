import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  PackageSearch,
  Tags,
  Boxes,
  History,
  Store,
  Building2,
  Building,
  Users,
  LogOut,
  Menu,
  X,
  Utensils,
  FilePlus2,
} from "lucide-react";
import { useGetMe, useLogout, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

type NavItem = {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
};
type NavSection = { title: string; items: NavItem[] };

const ADMIN_NAV: NavSection[] = [
  {
    title: "Operación",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
      { name: "Pedidos", href: "/pedidos", icon: ShoppingCart },
      { name: "Facturas", href: "/facturas", icon: Receipt },
      { name: "Nueva factura", href: "/facturas/nueva", icon: FilePlus2 },
      { name: "Stock", href: "/stock", icon: Boxes },
      { name: "Movimientos", href: "/stock/movimientos", icon: History },
    ],
  },
  {
    title: "Catálogo",
    items: [
      { name: "Productos", href: "/productos", icon: PackageSearch },
      { name: "Categorías", href: "/categorias", icon: Tags },
    ],
  },
  {
    title: "Organización",
    items: [
      { name: "Locales", href: "/locales", icon: Store },
      { name: "Marcas", href: "/marcas", icon: Building2 },
      { name: "Sociedades", href: "/sociedades", icon: Building },
    ],
  },
  {
    title: "Sistema",
    items: [{ name: "Usuarios", href: "/usuarios", icon: Users }],
  },
];

const LOCAL_NAV: NavSection[] = [
  {
    title: "Operación",
    items: [
      { name: "Catálogo", href: "/catalogo", icon: Utensils },
      { name: "Mis pedidos", href: "/pedidos", icon: ShoppingCart },
      { name: "Stock de mi local", href: "/stock", icon: Boxes },
    ],
  },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useGetMe({
    query: { retry: false, staleTime: 30_000 } as any,
  });
  const logoutMutation = useLogout({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setLocation("/login");
      },
    },
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  const isLocalRole = user?.role !== "admin";
  const allowedForLocal = [
    "/catalogo",
    "/pedidos",
    "/stock",
  ];

  useEffect(() => {
    if (!user) return;
    if (isLocalRole) {
      if (location === "/") {
        setLocation("/catalogo");
        return;
      }
      const isAllowed = allowedForLocal.some(
        (p) => location === p || location.startsWith(p + "/"),
      );
      if (!isAllowed) {
        setLocation("/catalogo");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, location]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-foreground">Cargando...</div>;
  }

  if (!user) return null;

  const navSections = user.role === "admin" ? ADMIN_NAV : LOCAL_NAV;

  const Navigation = () => (
    <ScrollArea className="flex-1 py-4">
      <div className="space-y-6 px-3">
        {navSections.map((section, i) => (
          <div key={i} className="space-y-1">
            <h4 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">
              {section.title}
            </h4>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive =
                  location === item.href ||
                  (item.href !== "/" && location === item.href) ||
                  (item.href !== "/" &&
                    item.href !== "/facturas/nueva" &&
                    location.startsWith(item.href + "/"));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );

  return (
    <div className="min-h-screen flex w-full bg-background text-foreground">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r bg-sidebar border-sidebar-border">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2 font-bold text-lg text-sidebar-primary-foreground tracking-tight">
            <Boxes className="h-6 w-6 text-primary" />
            GHF Inventarios
          </div>
        </div>
        <Navigation />
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-9 w-9 border border-sidebar-accent">
              <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">
                {user.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col flex-1 overflow-hidden">
              <span className="text-sm font-medium truncate text-sidebar-primary-foreground">{user.name}</span>
              <span className="text-xs text-sidebar-foreground/70 truncate capitalize">
                {user.role} {user.localNombre && `- ${user.localNombre}`}
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start text-sidebar-foreground bg-sidebar border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar & Header */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden h-16 flex items-center justify-between px-4 border-b bg-card">
          <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <Boxes className="h-6 w-6 text-primary" />
            GHF
          </div>
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 flex flex-col bg-sidebar border-sidebar-border text-sidebar-foreground">
              <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
                <div className="flex items-center gap-2 font-bold text-lg text-sidebar-primary-foreground tracking-tight">
                  <Boxes className="h-6 w-6 text-primary" />
                  GHF Inventarios
                </div>
              </div>
              <Navigation />
              <div className="p-4 border-t border-sidebar-border">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-9 w-9 border border-sidebar-accent">
                    <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">
                      {user.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <span className="text-sm font-medium truncate text-sidebar-primary-foreground">{user.name}</span>
                    <span className="text-xs text-sidebar-foreground/70 truncate capitalize">
                      {user.role} {user.localNombre && `- ${user.localNombre}`}
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full justify-start text-sidebar-foreground bg-sidebar border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Cerrar sesión
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </header>

        {/* Desktop Topbar */}
        <header className="hidden lg:flex h-16 items-center justify-between px-8 border-b bg-card">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold capitalize">
              {location.split("/")[1] || "Dashboard"}
            </h1>
            {user.localNombre && (
              <Badge variant="secondary" className="font-normal text-xs">
                <Store className="h-3 w-3 mr-1" />
                {user.localNombre}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4">
             <Badge variant={user.role === "admin" ? "default" : "outline"} className="capitalize">
              {user.role}
            </Badge>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-muted/30">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
