import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Camera, Upload, Filter, Eye, Trash2, BarChart3, TrendingUp, AlertCircle, CheckCircle2, Settings as SettingsIcon, Video } from "lucide-react";
import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import CameraCapture from "@/components/CameraCapture";

export default function Dashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  // Filters state
  const [plateFilter, setPlateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [minConfidence, setMinConfidence] = useState<number>(0);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  // Upload dialog state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Active tab state
  const [activeTab, setActiveTab] = useState<string>("upload");

  // Fetch detections with filters
  const { data: detectionsData, isLoading: detectionsLoading } = trpc.detections.list.useQuery({
    limit: pageSize,
    offset: page * pageSize,
    plateText: plateFilter || undefined,
    status: statusFilter !== "ALL" ? (statusFilter as any) : undefined,
    minConfidence: minConfidence > 0 ? minConfidence : undefined,
  });

  // Fetch stats
  const { data: stats } = trpc.detections.stats.useQuery();

  // Upload mutation
  const uploadMutation = trpc.detections.uploadImage.useMutation({
    onSuccess: (data) => {
      toast.success(`Imagen procesada: ${data.detections.length} placa(s) detectada(s)`);
      setUploadDialogOpen(false);
      setSelectedFile(null);
      utils.detections.list.invalidate();
      utils.detections.stats.invalidate();
    },
    onError: (error) => {
      toast.error(`Error al procesar imagen: ${error.message}`);
    },
  });

  // Delete mutation
  const deleteMutation = trpc.detections.delete.useMutation({
    onSuccess: () => {
      toast.success("Registro eliminado");
      utils.detections.list.invalidate();
      utils.detections.stats.invalidate();
    },
    onError: (error) => {
      toast.error(`Error al eliminar: ${error.message}`);
    },
  });

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (16MB max)
      if (file.size > 16 * 1024 * 1024) {
        toast.error("El archivo es muy grande (máximo 16MB)");
        return;
      }
      // Validate file type
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error("Tipo de archivo no válido. Use JPEG, PNG o WEBP");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const base64Data = base64.split(',')[1]; // Remove data:image/...;base64, prefix

        await uploadMutation.mutateAsync({
          imageData: base64Data,
          mimeType: selectedFile.type,
        });
        setUploading(false);
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      setUploading(false);
    }
  };

  // Handle camera capture
  const handleCameraCapture = async (imageData: string, mimeType: string) => {
    try {
      await uploadMutation.mutateAsync({
        imageData,
        mimeType,
      });
    } catch (error) {
      // Error already handled by mutation
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("¿Está seguro de eliminar este registro?")) {
      deleteMutation.mutate({ id });
    }
  };

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Cargando...</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string, confidence: number) => {
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
            <Link href="/settings">
              <Button variant="outline" size="sm">
                <SettingsIcon className="h-4 w-4" />
              </Button>
            </Link>
            <span className="text-sm text-slate-400">Hola, {user?.name}</span>
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  Procesar Imagen
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-800 max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-white">Procesar Imagen para Detección de Placas</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Elige entre subir una imagen o usar tu cámara en tiempo real
                  </DialogDescription>
                </DialogHeader>
                
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-slate-800">
                    <TabsTrigger value="upload" className="data-[state=active]:bg-slate-700">
                      <Upload className="mr-2 h-4 w-4" />
                      Subir Imagen
                    </TabsTrigger>
                    <TabsTrigger value="camera" className="data-[state=active]:bg-slate-700">
                      <Video className="mr-2 h-4 w-4" />
                      Cámara en Tiempo Real
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload" className="space-y-4 mt-4">
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader>
                        <CardTitle className="text-white text-lg">Subir Imagen Estática</CardTitle>
                        <CardDescription className="text-slate-400">
                          Selecciona una imagen desde tu dispositivo
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="image" className="text-slate-300">Imagen (JPEG, PNG, WEBP - máx 16MB)</Label>
                          <Input
                            id="image"
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={handleFileChange}
                            className="bg-slate-800 border-slate-700 text-white"
                          />
                        </div>
                        {selectedFile && (
                          <div className="text-sm text-slate-400">
                            Archivo seleccionado: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                          </div>
                        )}
                        <Button
                          onClick={handleUpload}
                          disabled={!selectedFile || uploading}
                          className="w-full"
                        >
                          {uploading ? "Procesando..." : "Procesar Imagen"}
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="camera" className="mt-4">
                    <CameraCapture 
                      onCapture={handleCameraCapture}
                      isProcessing={uploadMutation.isPending}
                    />
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <div className="container py-8">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total Detecciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{stats?.total || 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Hoy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{stats?.today || 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Confianza Promedio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{stats?.avgConfidence || 0}%</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Estado OK</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">
                {stats?.byStatus?.find(s => s.status === 'OK')?.count || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-slate-900/50 border-slate-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <Label htmlFor="plate" className="text-slate-300">Placa</Label>
                <Input
                  id="plate"
                  placeholder="Buscar placa..."
                  value={plateFilter}
                  onChange={(e) => setPlateFilter(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label htmlFor="status" className="text-slate-300">Estado</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="ALL">Todos</SelectItem>
                    <SelectItem value="OK">OK</SelectItem>
                    <SelectItem value="LOW_CONFIDENCE">Baja Confianza</SelectItem>
                    <SelectItem value="MANUAL_REVIEW">Revisión Manual</SelectItem>
                    <SelectItem value="NO_PLATE_FOUND">Sin Placa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="confidence" className="text-slate-300">Confianza Mínima (%)</Label>
                <Input
                  id="confidence"
                  type="number"
                  min="0"
                  max="100"
                  value={minConfidence}
                  onChange={(e) => setMinConfidence(Number(e.target.value))}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPlateFilter("");
                    setStatusFilter("ALL");
                    setMinConfidence(0);
                    setPage(0);
                  }}
                  className="w-full"
                >
                  Limpiar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detections Table */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Registros de Detección</CardTitle>
            <CardDescription className="text-slate-400">
              {detectionsData?.total || 0} registros encontrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {detectionsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-slate-400">Cargando registros...</p>
              </div>
            ) : detectionsData?.detections.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                No se encontraron registros. Procesa una imagen para comenzar.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-800">
                        <TableHead className="text-slate-300">Placa</TableHead>
                        <TableHead className="text-slate-300">Confianza</TableHead>
                        <TableHead className="text-slate-300">Estado</TableHead>
                        <TableHead className="text-slate-300">Fecha/Hora</TableHead>
                        <TableHead className="text-slate-300">Cámara</TableHead>
                        <TableHead className="text-slate-300 text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detectionsData?.detections.map((detection) => (
                        <TableRow key={detection.id} className="border-slate-800">
                          <TableCell className="font-mono font-bold text-white">
                            {detection.plateText}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="text-white">{detection.confidence}%</div>
                              {detection.confidence < 60 && (
                                <AlertCircle className="h-4 w-4 text-yellow-500" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(detection.status, detection.confidence)}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {new Date(detection.detectedAt).toLocaleString('es-ES')}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {detection.cameraId || '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Link href={`/detection/${detection.id}`}>
                                <Button size="sm" variant="outline">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(detection.id)}
                                className="text-red-500 hover:text-red-400"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-slate-400">
                    Mostrando {page * pageSize + 1} - {Math.min((page + 1) * pageSize, detectionsData?.total || 0)} de {detectionsData?.total || 0}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => p + 1)}
                      disabled={!detectionsData?.hasMore}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
