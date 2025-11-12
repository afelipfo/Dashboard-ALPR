import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Camera, ArrowLeft, Calendar, Percent, MapPin, Image as ImageIcon } from "lucide-react";
import { Link, useParams, useLocation } from "wouter";

export default function DetectionDetail() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const params = useParams();
  const [, navigate] = useLocation();
  const detectionId = params.id ? parseInt(params.id) : 0;

  const { data: detection, isLoading } = trpc.detections.getById.useQuery(
    { id: detectionId },
    { enabled: detectionId > 0 }
  );

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!detection) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Registro no encontrado</p>
          <Link href="/dashboard">
            <Button>Volver al Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OK":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">OK</Badge>;
      case "LOW_CONFIDENCE":
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Baja Confianza</Badge>;
      case "MANUAL_REVIEW":
        return <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20">Revisión Manual</Badge>;
      case "NO_PLATE_FOUND":
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Sin Placa</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const bbox = JSON.parse(detection.bbox);

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
                Volver
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container py-8 max-w-6xl">
        {/* Header Info */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">Detalle de Detección #{detection.id}</h2>
          <p className="text-slate-400">Información completa del registro de detección de placa</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Detection Info Card */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Información de Detección</CardTitle>
              <CardDescription className="text-slate-400">
                Datos extraídos de la imagen procesada
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-slate-400 mb-1">Placa Detectada</div>
                <div className="text-3xl font-mono font-bold text-white bg-slate-800 rounded-lg p-4 text-center border-2 border-blue-500/20">
                  {detection.plateText}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-slate-400 mb-1 flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    Confianza
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {detection.confidence}%
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 mt-2">
                    <div
                      className={`h-2 rounded-full ${
                        detection.confidence >= 80
                          ? 'bg-green-500'
                          : detection.confidence >= 60
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${detection.confidence}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="text-sm text-slate-400 mb-1">Estado</div>
                  <div className="mt-2">
                    {getStatusBadge(detection.status)}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm text-slate-400 mb-1 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Fecha y Hora de Detección
                </div>
                <div className="text-lg text-white">
                  {new Date(detection.detectedAt).toLocaleString('es-ES', {
                    dateStyle: 'full',
                    timeStyle: 'long'
                  })}
                </div>
              </div>

              {detection.cameraId && (
                <div>
                  <div className="text-sm text-slate-400 mb-1 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Cámara/Origen
                  </div>
                  <div className="text-lg text-white">{detection.cameraId}</div>
                </div>
              )}

              <div>
                <div className="text-sm text-slate-400 mb-1">Bounding Box (coordenadas)</div>
                <div className="bg-slate-800 rounded-lg p-3 font-mono text-sm text-slate-300">
                  <div>x_min: {bbox.x_min?.toFixed(2) || 0}</div>
                  <div>y_min: {bbox.y_min?.toFixed(2) || 0}</div>
                  <div>x_max: {bbox.x_max?.toFixed(2) || 0}</div>
                  <div>y_max: {bbox.y_max?.toFixed(2) || 0}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Images Card */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Imágenes
              </CardTitle>
              <CardDescription className="text-slate-400">
                Imagen original y recorte de la placa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-slate-400 mb-2">Imagen Original</div>
                <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
                  <img
                    src={detection.originalImageUrl}
                    alt="Imagen original"
                    className="w-full h-auto"
                  />
                </div>
                <a
                  href={detection.originalImageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:text-blue-300 mt-2 inline-block"
                >
                  Ver en tamaño completo →
                </a>
              </div>

              {detection.croppedImageUrl && (
                <div>
                  <div className="text-sm text-slate-400 mb-2">Recorte de Placa</div>
                  <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
                    <img
                      src={detection.croppedImageUrl}
                      alt="Recorte de placa"
                      className="w-full h-auto"
                    />
                  </div>
                  <a
                    href={detection.croppedImageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-400 hover:text-blue-300 mt-2 inline-block"
                  >
                    Ver en tamaño completo →
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Interpretation Guide */}
        <Card className="bg-slate-900/50 border-slate-800 mt-6">
          <CardHeader>
            <CardTitle className="text-white">Guía de Interpretación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-slate-300">
            <div>
              <strong className="text-white">Estado OK:</strong> La placa fue detectada con alta confianza (≥60%) y coincide con patrones válidos.
            </div>
            <div>
              <strong className="text-white">Baja Confianza:</strong> El OCR tiene dudas sobre la lectura. Confianza {'<'}60%. Revisar manualmente.
            </div>
            <div>
              <strong className="text-white">Revisión Manual:</strong> El texto detectado no coincide con patrones de placa válidos. Verificar.
            </div>
            <div>
              <strong className="text-white">Sin Placa:</strong> No se detectó ninguna placa en la imagen.
            </div>
            <div className="pt-2 border-t border-slate-800 text-sm text-slate-400">
              <strong>Nota de Privacidad:</strong> Este registro contiene datos personales. El acceso ha sido registrado en el log de auditoría.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
