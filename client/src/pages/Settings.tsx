import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Camera, Shield, Trash2, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function Settings() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const utils = trpc.useUtils();

  const [retentionDays, setRetentionDays] = useState(90);
  const [retentionEnabled, setRetentionEnabled] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch retention config
  const { data: retentionConfig, isLoading: configLoading } = trpc.retention.getConfig.useQuery();
  const { data: retentionStats } = trpc.retention.getStats.useQuery();

  // Update config mutation
  const updateConfigMutation = trpc.retention.updateConfig.useMutation({
    onSuccess: () => {
      toast.success("Configuración actualizada correctamente");
      setHasChanges(false);
      utils.retention.getConfig.invalidate();
      utils.retention.getStats.invalidate();
    },
    onError: (error) => {
      toast.error(`Error al actualizar: ${error.message}`);
    },
  });

  // Run cleanup mutation
  const runCleanupMutation = trpc.retention.runCleanup.useMutation({
    onSuccess: (data) => {
      toast.success(`Limpieza completada: ${data.deleted} registros eliminados`);
      utils.retention.getStats.invalidate();
      utils.detections.stats.invalidate();
    },
    onError: (error) => {
      toast.error(`Error en limpieza: ${error.message}`);
    },
  });

  // Load initial config
  useEffect(() => {
    if (retentionConfig) {
      setRetentionDays(retentionConfig.retentionDays);
      setRetentionEnabled(retentionConfig.enabled);
    }
  }, [retentionConfig]);

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  if (authLoading || configLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Cargando...</p>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    updateConfigMutation.mutate({
      retentionDays,
      enabled: retentionEnabled,
    });
  };

  const handleRunCleanup = () => {
    if (confirm("¿Está seguro de ejecutar la limpieza ahora? Esto eliminará registros antiguos según la configuración actual.")) {
      runCleanupMutation.mutate();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <div className="flex items-center gap-3 cursor-pointer">
                <Camera className="h-8 w-8 text-blue-500" />
                <h1 className="text-xl font-bold text-white">{APP_TITLE}</h1>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">Hola, {user?.name}</span>
            <Link href="/dashboard">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container py-8 max-w-4xl">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">Configuración de Privacidad</h2>
          <p className="text-slate-400">Gestión de retención de datos y cumplimiento normativo</p>
        </div>

        {/* Retention Policy Card */}
        <Card className="bg-slate-900/50 border-slate-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Política de Retención de Datos
            </CardTitle>
            <CardDescription className="text-slate-400">
              Configure el tiempo de retención de registros de detección según normativas locales
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="retention-enabled" className="text-slate-300 text-base">
                  Habilitar limpieza automática
                </Label>
                <p className="text-sm text-slate-500 mt-1">
                  Elimina automáticamente registros antiguos cada 24 horas
                </p>
              </div>
              <Switch
                id="retention-enabled"
                checked={retentionEnabled}
                onCheckedChange={(checked) => {
                  setRetentionEnabled(checked);
                  setHasChanges(true);
                }}
              />
            </div>

            <div>
              <Label htmlFor="retention-days" className="text-slate-300">
                Días de retención
              </Label>
              <p className="text-sm text-slate-500 mb-2">
                Registros más antiguos que este período serán eliminados automáticamente
              </p>
              <Input
                id="retention-days"
                type="number"
                min="1"
                max="365"
                value={retentionDays}
                onChange={(e) => {
                  setRetentionDays(Number(e.target.value));
                  setHasChanges(true);
                }}
                className="bg-slate-800 border-slate-700 text-white max-w-xs"
              />
              <p className="text-sm text-slate-500 mt-2">
                Recomendado: 30-90 días para cumplimiento de GDPR/LOPD
              </p>
            </div>

            {retentionConfig?.lastRun && (
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Última limpieza automática:{" "}
                  {new Date(retentionConfig.lastRun).toLocaleString('es-ES')}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <Button
                onClick={handleSave}
                disabled={!hasChanges || updateConfigMutation.isPending}
              >
                {updateConfigMutation.isPending ? "Guardando..." : "Guardar Configuración"}
              </Button>
              {hasChanges && (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (retentionConfig) {
                      setRetentionDays(retentionConfig.retentionDays);
                      setRetentionEnabled(retentionConfig.enabled);
                      setHasChanges(false);
                    }
                  }}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Statistics Card */}
        <Card className="bg-slate-900/50 border-slate-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Estadísticas de Retención</CardTitle>
            <CardDescription className="text-slate-400">
              Información sobre el estado actual de los datos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <div className="text-sm text-slate-400 mb-1">Total de Registros</div>
                <div className="text-2xl font-bold text-white">
                  {retentionStats?.totalRecords || 0}
                </div>
              </div>

              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <div className="text-sm text-slate-400 mb-1">Registros a Eliminar</div>
                <div className="text-2xl font-bold text-orange-500">
                  {retentionStats?.recordsToDelete || 0}
                </div>
              </div>
            </div>

            {retentionStats?.oldestRecord && (
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <div className="text-sm text-slate-400 mb-1">Registro Más Antiguo</div>
                <div className="text-white">
                  {new Date(retentionStats.oldestRecord).toLocaleString('es-ES')}
                </div>
              </div>
            )}

            {retentionStats?.newestRecord && (
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <div className="text-sm text-slate-400 mb-1">Registro Más Reciente</div>
                <div className="text-white">
                  {new Date(retentionStats.newestRecord).toLocaleString('es-ES')}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manual Cleanup Card */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Limpieza Manual
            </CardTitle>
            <CardDescription className="text-slate-400">
              Ejecutar limpieza de registros antiguos inmediatamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-200">
                  <strong>Advertencia:</strong> Esta acción eliminará permanentemente todos los registros
                  más antiguos que {retentionDays} días. Esta operación no se puede deshacer.
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleRunCleanup}
              disabled={runCleanupMutation.isPending || (retentionStats?.recordsToDelete || 0) === 0}
              className="text-red-500 hover:text-red-400 border-red-500/20"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {runCleanupMutation.isPending ? "Ejecutando..." : "Ejecutar Limpieza Ahora"}
            </Button>

            {(retentionStats?.recordsToDelete || 0) === 0 && (
              <p className="text-sm text-slate-500 mt-2">
                No hay registros antiguos para eliminar en este momento.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Legal Notice */}
        <Card className="bg-blue-500/10 border-blue-500/20 mt-6">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Shield className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-200 space-y-2">
                <p>
                  <strong>Aviso Legal:</strong> Las placas vehiculares son datos personales asociados a bienes
                  registrables. La retención, consulta y cruce con identidad de propietarios puede estar
                  regulada por normativas locales de protección de datos (GDPR, LOPD, etc.).
                </p>
                <p>
                  El uso de este sistema para multas o control sancionatorio requiere alineación con la
                  autoridad competente y cadena de custodia de evidencia. Todos los accesos a registros
                  son auditados automáticamente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
