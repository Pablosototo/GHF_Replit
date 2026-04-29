import { useState, useEffect } from "react";
import { useGetConfiguracion, useUpdateConfiguracion } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type CfgMap = Record<string, string>;

function toCfgMap(items: Array<{ clave: string; valor?: string | null }>): CfgMap {
  const m: CfgMap = {};
  for (const i of items) m[i.clave] = i.valor ?? "";
  return m;
}

export default function Configuracion() {
  const { toast } = useToast();
  const { data: items, isLoading } = useGetConfiguracion();
  const updateMutation = useUpdateConfiguracion();

  const [cfg, setCfg] = useState<CfgMap>({});

  useEffect(() => {
    if (items) setCfg(toCfgMap(items));
  }, [items]);

  const set = (clave: string, valor: string) =>
    setCfg((prev) => ({ ...prev, [clave]: valor }));

  const handleSave = () => {
    const allClaves = items?.map((i) => i.clave) ?? [];
    updateMutation.mutate(
      {
        data: {
          items: allClaves.map((clave) => ({ clave, valor: cfg[clave] ?? "" })),
        },
      },
      {
        onSuccess: () =>
          toast({ title: "Guardado", description: "Configuración actualizada." }),
        onError: () =>
          toast({ variant: "destructive", title: "Error", description: "No se pudo guardar." }),
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Configuración</h2>
        <p className="text-muted-foreground">Ajustes generales del sistema.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notificaciones por correo</CardTitle>
          <CardDescription>
            Cuando se cree un pedido, se enviará un aviso a estos correos. Separalos por coma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={3}
            placeholder="correo1@ejemplo.com, correo2@ejemplo.com"
            value={cfg["notif_emails"] ?? ""}
            onChange={(e) => set("notif_emails", e.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuración SMTP</CardTitle>
          <CardDescription>
            Credenciales del servidor de correo saliente. También pueden establecerse como variables
            de entorno (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Servidor (host)</label>
              <Input
                placeholder="smtp.gmail.com"
                value={cfg["smtp_host"] ?? ""}
                onChange={(e) => set("smtp_host", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Puerto</label>
              <Input
                placeholder="587"
                value={cfg["smtp_port"] ?? ""}
                onChange={(e) => set("smtp_port", e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Usuario</label>
              <Input
                placeholder="correo@empresa.com"
                value={cfg["smtp_user"] ?? ""}
                onChange={(e) => set("smtp_user", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Contraseña</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={cfg["smtp_pass"] ?? ""}
                onChange={(e) => set("smtp_pass", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Remitente (from)</label>
            <Input
              placeholder="GHF Inventarios <no-reply@empresa.com>"
              value={cfg["smtp_from"] ?? ""}
              onChange={(e) => set("smtp_from", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}
