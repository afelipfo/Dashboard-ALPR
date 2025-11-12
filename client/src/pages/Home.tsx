import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { Camera, Shield, BarChart3, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Camera className="h-8 w-8 text-blue-500" />
            <h1 className="text-xl font-bold text-white">{APP_TITLE}</h1>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-slate-400">Hola, {user?.name}</span>
                <Link href="/dashboard">
                  <Button>Ir al Dashboard</Button>
                </Link>
              </>
            ) : (
              <a href={getLoginUrl()}>
                <Button>Iniciar Sesión</Button>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-20">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-4 py-2 text-sm text-blue-400 border border-blue-500/20">
            <CheckCircle2 className="h-4 w-4" />
            Sistema de Detección Automática de Placas Vehiculares
          </div>
          <h2 className="mb-6 text-5xl font-bold text-white leading-tight">
            Detección y Reconocimiento de Placas en Tiempo Real
          </h2>
          <p className="mb-8 text-xl text-slate-400 leading-relaxed">
            Tecnología avanzada de visión por computadora para identificar y registrar placas vehiculares con alta precisión. 
            Ideal para control de accesos, registro de infracciones y analítica de flujo vehicular.
          </p>
          <div className="flex gap-4 justify-center">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="lg" className="text-lg px-8">
                  Comenzar Ahora
                </Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="lg" className="text-lg px-8">
                  Comenzar Ahora
                </Button>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container py-20">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <Camera className="h-10 w-10 text-blue-500 mb-2" />
              <CardTitle className="text-white">Detección Automática</CardTitle>
              <CardDescription className="text-slate-400">
                Localiza placas vehiculares en imágenes con bounding boxes precisos utilizando modelos de deep learning.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CheckCircle2 className="h-10 w-10 text-green-500 mb-2" />
              <CardTitle className="text-white">OCR de Alta Precisión</CardTitle>
              <CardDescription className="text-slate-400">
                Reconocimiento de texto alfanumérico con scores de confianza y validación de patrones.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <Clock className="h-10 w-10 text-purple-500 mb-2" />
              <CardTitle className="text-white">Procesamiento Rápido</CardTitle>
              <CardDescription className="text-slate-400">
                Análisis en tiempo casi real con latencia menor a 2 segundos por imagen.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <BarChart3 className="h-10 w-10 text-orange-500 mb-2" />
              <CardTitle className="text-white">Dashboard Analítico</CardTitle>
              <CardDescription className="text-slate-400">
                Visualiza estadísticas, filtra registros por fecha, placa, confianza y estado.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <Shield className="h-10 w-10 text-red-500 mb-2" />
              <CardTitle className="text-white">Privacidad y Auditoría</CardTitle>
              <CardDescription className="text-slate-400">
                Retención configurable de datos, registro de accesos y cumplimiento normativo.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <AlertTriangle className="h-10 w-10 text-yellow-500 mb-2" />
              <CardTitle className="text-white">Manejo de Incertidumbre</CardTitle>
              <CardDescription className="text-slate-400">
                Identifica detecciones de baja confianza para revisión manual y mejora continua.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Use Cases */}
      <section className="container py-20">
        <div className="mx-auto max-w-4xl">
          <h3 className="mb-12 text-3xl font-bold text-center text-white">Casos de Uso</h3>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mb-4 mx-auto w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <Camera className="h-8 w-8 text-blue-500" />
              </div>
              <h4 className="mb-2 text-lg font-semibold text-white">Control Vehicular</h4>
              <p className="text-slate-400">
                Gestión de accesos en parqueaderos, patios y zonas restringidas.
              </p>
            </div>
            <div className="text-center">
              <div className="mb-4 mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
              <h4 className="mb-2 text-lg font-semibold text-white">Registro de Infracciones</h4>
              <p className="text-slate-400">
                Detección de cruces en rojo, pico y placa, invasión de carril.
              </p>
            </div>
            <div className="text-center">
              <div className="mb-4 mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                <BarChart3 className="h-8 w-8 text-green-500" />
              </div>
              <h4 className="mb-2 text-lg font-semibold text-white">Analítica de Flujo</h4>
              <p className="text-slate-400">
                Conteo de placas únicas y análisis de patrones de tráfico.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-20">
        <div className="mx-auto max-w-2xl text-center bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-12">
          <h3 className="mb-4 text-3xl font-bold text-white">¿Listo para comenzar?</h3>
          <p className="mb-8 text-lg text-slate-400">
            Inicia sesión y comienza a procesar imágenes de vehículos en segundos.
          </p>
          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button size="lg" className="text-lg px-8">
                Ir al Dashboard
              </Button>
            </Link>
          ) : (
            <a href={getLoginUrl()}>
              <Button size="lg" className="text-lg px-8">
                Iniciar Sesión
              </Button>
            </a>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 bg-slate-950/50">
        <div className="container text-center text-sm text-slate-500">
          <p>© 2025 {APP_TITLE}. Sistema de Detección y Reconocimiento de Placas Vehiculares.</p>
          <p className="mt-2">
            Los datos de placas vehiculares son información personal. Este sistema cumple con normativas de privacidad y retención de datos.
          </p>
        </div>
      </footer>
    </div>
  );
}
