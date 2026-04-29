import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Boxes, Loader2 } from "lucide-react";
import { useLogin, getGetMeQueryKey } from "@workspace/api-client-react";
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

const loginSchema = z.object({
  username: z.string().min(1, "El usuario es requerido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const loginMutation = useLogin({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({
          title: "Sesión iniciada",
          description: "Bienvenido al sistema.",
        });
        setLocation(data?.role === "admin" ? "/" : "/catalogo");
      },
      onError: (error) => {
        toast({
          title: "Error al iniciar sesión",
          description: error.message || "Credenciales inválidas",
          variant: "destructive",
        });
      },
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate({ data });
  };

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left side - Branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-sidebar p-12 text-sidebar-foreground">
        <div className="flex items-center gap-3 font-bold text-2xl tracking-tight">
          <Boxes className="h-8 w-8 text-primary" />
          GHF Holding
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

      {/* Right side - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24">
        <div className="mx-auto w-full max-w-sm space-y-8">
          <div className="space-y-2 text-center lg:text-left">
            <div className="flex lg:hidden items-center justify-center gap-2 font-bold text-2xl mb-8">
              <Boxes className="h-8 w-8 text-primary" />
              GHF Inventarios
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Iniciar sesión</h2>
            <p className="text-muted-foreground">
              Ingresa tus credenciales para acceder al sistema.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
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
                control={form.control}
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
              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Ingresar al sistema
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
