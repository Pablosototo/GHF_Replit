import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Boxes, Loader2, ChevronLeft, ShieldCheck, Store } from "lucide-react";
import {
  useLogin,
  useLoginLocal,
  useGetMarcasLogin,
  useGetLocalesLogin,
  getGetMeQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type LoginMode = "choose" | "admin" | "local-marca" | "local-local" | "local-pass";

const adminSchema = z.object({
  username: z.string().min(1, "El usuario es requerido"),
  password: z.string().min(1, "La contraseña es requerida"),
});
const localPassSchema = z.object({
  password: z.string().min(1, "La contraseña es requerida"),
});

type AdminForm = z.infer<typeof adminSchema>;
type LocalPassForm = z.infer<typeof localPassSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<LoginMode>("choose");
  const [selectedMarcaId, setSelectedMarcaId] = useState<number | null>(null);
  const [selectedLocalId, setSelectedLocalId] = useState<number | null>(null);

  const { data: marcas, isLoading: loadingMarcas } = useGetMarcasLogin();
  const { data: locales, isLoading: loadingLocales } = useGetLocalesLogin(
    { marcaId: selectedMarcaId ?? 0 },
  );

  const adminForm = useForm<AdminForm>({
    resolver: zodResolver(adminSchema),
    defaultValues: { username: "", password: "" },
  });
  const localPassForm = useForm<LocalPassForm>({
    resolver: zodResolver(localPassSchema),
    defaultValues: { password: "" },
  });

  const onAuthSuccess = (role: string) => {
    queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
    toast({ title: "Sesión iniciada", description: "Bienvenido al sistema." });
    setLocation(role === "admin" ? "/" : "/catalogo");
  };

  const onAuthError = (error: unknown) => {
    const msg = (error as { message?: string })?.message || "Credenciales inválidas";
    toast({ title: "Error al iniciar sesión", description: msg, variant: "destructive" });
  };

  const adminMutation = useLogin({
    mutation: {
      onSuccess: (data) => onAuthSuccess(data?.role ?? "local"),
      onError: onAuthError,
    },
  });

  const localMutation = useLoginLocal({
    mutation: {
      onSuccess: (data) => onAuthSuccess(data?.role ?? "local"),
      onError: onAuthError,
    },
  });

  const localNombre = locales?.find((l) => l.id === selectedLocalId)?.nombre;
  const marcaNombre = marcas?.find((m) => m.id === selectedMarcaId)?.nombre;

  const goBack = () => {
    if (mode === "admin") setMode("choose");
    else if (mode === "local-marca") setMode("choose");
    else if (mode === "local-local") { setMode("local-marca"); setSelectedMarcaId(null); }
    else if (mode === "local-pass") { setMode("local-local"); setSelectedLocalId(null); }
  };

  const branding = (
    <div className="hidden lg:flex flex-col justify-between w-1/2 bg-sidebar p-12 text-sidebar-foreground">
      <div className="flex items-center gap-3 font-bold text-2xl tracking-tight">
        <Boxes className="h-8 w-8 text-primary" />
        GHF Inventarios y Facturación
      </div>
      <div className="space-y-6">
        <h1 className="text-4xl font-bold tracking-tight text-sidebar-primary-foreground">
          Control operativo <br />
          para múltiples marcas.
        </h1>
        <p className="text-sidebar-foreground/80 text-lg max-w-md">
          Gestiona stock, facturación y pedidos de todas tus sucursales desde un único lugar con precisión y velocidad.
        </p>
      </div>
      <div className="text-sm text-sidebar-foreground/60">
        &copy; {new Date().getFullYear()} GHF Inventarios. Todos los derechos reservados.
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full flex bg-background">
      {branding}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24">
        <div className="mx-auto w-full max-w-sm space-y-8">
          <div className="flex lg:hidden items-center justify-center gap-2 font-bold text-2xl mb-4">
            <Boxes className="h-8 w-8 text-primary" />
            GHF Inventarios
          </div>

          {/* Back button */}
          {mode !== "choose" && (
            <button
              type="button"
              onClick={goBack}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition"
            >
              <ChevronLeft className="h-4 w-4" />
              Atrás
            </button>
          )}

          {/* ── PASO 0: elegir tipo ── */}
          {mode === "choose" && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-3xl font-bold tracking-tight">Iniciar sesión</h2>
                <p className="text-muted-foreground">Seleccioná tu tipo de acceso.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setMode("admin")}
                  className={cn(
                    "rounded-xl border-2 p-6 text-left transition hover:border-primary hover:bg-primary/5",
                    "flex flex-col gap-2",
                  )}
                >
                  <ShieldCheck className="h-7 w-7 text-primary" />
                  <span className="font-semibold text-base">Administrador</span>
                  <span className="text-xs text-muted-foreground">Acceso completo al sistema</span>
                </button>
                <button
                  onClick={() => setMode("local-marca")}
                  className={cn(
                    "rounded-xl border-2 p-6 text-left transition hover:border-primary hover:bg-primary/5",
                    "flex flex-col gap-2",
                  )}
                >
                  <Store className="h-7 w-7 text-primary" />
                  <span className="font-semibold text-base">Local</span>
                  <span className="text-xs text-muted-foreground">Catálogo y pedidos de tu sucursal</span>
                </button>
              </div>
            </div>
          )}

          {/* ── PASO 1a: admin ── */}
          {mode === "admin" && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-3xl font-bold tracking-tight">Administrador</h2>
                <p className="text-muted-foreground">Ingresá tus credenciales.</p>
              </div>
              <Form {...adminForm}>
                <form onSubmit={adminForm.handleSubmit((d) => adminMutation.mutate({ data: d }))} className="space-y-5">
                  <FormField
                    control={adminForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Usuario</FormLabel>
                        <FormControl>
                          <Input placeholder="admin" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={adminForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contraseña</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={adminMutation.isPending}>
                    {adminMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Ingresar
                  </Button>
                </form>
              </Form>
            </div>
          )}

          {/* ── PASO 1b: elegir marca ── */}
          {mode === "local-marca" && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-3xl font-bold tracking-tight">Seleccioná tu marca</h2>
                <p className="text-muted-foreground">¿A cuál marca pertenece tu local?</p>
              </div>
              {loadingMarcas ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {marcas?.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => { setSelectedMarcaId(m.id); setMode("local-local"); }}
                      className="rounded-xl border-2 p-5 text-left font-semibold transition hover:border-primary hover:bg-primary/5"
                    >
                      {m.nombre}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── PASO 2b: elegir local ── */}
          {mode === "local-local" && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-3xl font-bold tracking-tight">{marcaNombre}</h2>
                <p className="text-muted-foreground">Seleccioná tu sucursal.</p>
              </div>
              {loadingLocales ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {locales?.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => { setSelectedLocalId(l.id); setMode("local-pass"); }}
                      className="w-full rounded-lg border px-4 py-3 text-left text-sm font-medium transition hover:border-primary hover:bg-primary/5"
                    >
                      {l.nombre}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── PASO 3b: contraseña local ── */}
          {mode === "local-pass" && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-3xl font-bold tracking-tight">{localNombre}</h2>
                <p className="text-muted-foreground">Ingresá la contraseña de tu local.</p>
              </div>
              <Form {...localPassForm}>
                <form
                  onSubmit={localPassForm.handleSubmit((d) =>
                    localMutation.mutate({ data: { localId: selectedLocalId!, password: d.password } }),
                  )}
                  className="space-y-5"
                >
                  <FormField
                    control={localPassForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contraseña</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" autoFocus {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={localMutation.isPending}>
                    {localMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Ingresar
                  </Button>
                </form>
              </Form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
