import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Camera, Square, Play, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";

interface CameraCaptureProps {
  onCapture: (imageData: string, mimeType: string) => Promise<void>;
  isProcessing: boolean;
}

export default function CameraCapture({ onCapture, isProcessing }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isAutoCapture, setIsAutoCapture] = useState(false);
  const [captureInterval, setCaptureInterval] = useState(3); // seconds
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [countdown, setCountdown] = useState<number>(0);

  // Get available camera devices
  useEffect(() => {
    async function getDevices() {
      try {
        const deviceList = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = deviceList.filter(device => device.kind === 'videoinput');
        setDevices(videoDevices);
        if (videoDevices.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(videoDevices[0].deviceId);
        }
      } catch (error) {
        console.error("Error enumerating devices:", error);
      }
    }
    getDevices();
  }, []);

  // Start camera
  const startCamera = async () => {
    try {
      const constraints: MediaStreamConstraints = {
        video: selectedDeviceId 
          ? { deviceId: { exact: selectedDeviceId } }
          : { facingMode: 'environment' }, // Prefer back camera on mobile
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      setIsCameraActive(true);
      toast.success("Cámara iniciada correctamente");
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast.error("No se pudo acceder a la cámara. Verifica los permisos.");
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setIsCameraActive(false);
    setIsAutoCapture(false);
    setCountdown(0);
    toast.info("Cámara detenida");
  };

  // Capture single frame
  const captureFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob
    canvas.toBlob(async (blob) => {
      if (!blob) return;

      // Convert blob to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(',')[1];
        
        try {
          await onCapture(base64Data, 'image/jpeg');
        } catch (error) {
          console.error("Error processing capture:", error);
        }
      };
      reader.readAsDataURL(blob);
    }, 'image/jpeg', 0.9);
  };

  // Start auto-capture
  const startAutoCapture = () => {
    if (!isCameraActive) {
      toast.error("Primero inicia la cámara");
      return;
    }

    setIsAutoCapture(true);
    setCountdown(captureInterval);

    // Initial capture
    captureFrame();

    // Set up interval for auto-capture
    intervalRef.current = setInterval(() => {
      captureFrame();
      setCountdown(captureInterval);
    }, captureInterval * 1000);

    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          return captureInterval;
        }
        return prev - 1;
      });
    }, 1000);

    // Store countdown interval to clear it later
    return () => clearInterval(countdownInterval);
  };

  // Stop auto-capture
  const stopAutoCapture = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsAutoCapture(false);
    setCountdown(0);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Captura desde Cámara en Tiempo Real
        </CardTitle>
        <CardDescription className="text-slate-400">
          Detecta placas automáticamente desde tu cámara web o dispositivo móvil
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Camera Selection */}
        {devices.length > 1 && !isCameraActive && (
          <div>
            <Label htmlFor="camera-select" className="text-slate-300">Seleccionar Cámara</Label>
            <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Selecciona una cámara" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {devices.map((device, index) => (
                  <SelectItem key={device.deviceId} value={device.deviceId}>
                    {device.label || `Cámara ${index + 1}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Video Preview */}
        <div className="relative bg-slate-950 rounded-lg overflow-hidden border border-slate-700">
          <video
            ref={videoRef}
            className="w-full h-auto"
            autoPlay
            playsInline
            muted
            style={{ maxHeight: '400px', objectFit: 'contain' }}
          />
          {!isCameraActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80">
              <div className="text-center">
                <Camera className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Cámara no iniciada</p>
              </div>
            </div>
          )}
          {isAutoCapture && (
            <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full flex items-center gap-2 animate-pulse">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span className="text-sm font-semibold">EN VIVO</span>
            </div>
          )}
          {isAutoCapture && countdown > 0 && (
            <div className="absolute bottom-4 left-4 bg-slate-900/90 text-white px-4 py-2 rounded-lg">
              <div className="text-sm text-slate-400">Próxima captura en</div>
              <div className="text-2xl font-bold">{countdown}s</div>
            </div>
          )}
          {isProcessing && (
            <div className="absolute top-4 left-4 bg-blue-500/90 text-white px-3 py-1 rounded-full flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Procesando...</span>
            </div>
          )}
        </div>

        {/* Hidden canvas for frame capture */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Camera Controls */}
        <div className="flex gap-2">
          {!isCameraActive ? (
            <Button onClick={startCamera} className="flex-1">
              <Play className="mr-2 h-4 w-4" />
              Iniciar Cámara
            </Button>
          ) : (
            <Button onClick={stopCamera} variant="outline" className="flex-1">
              <Square className="mr-2 h-4 w-4" />
              Detener Cámara
            </Button>
          )}
        </div>

        {/* Auto-capture Settings */}
        {isCameraActive && (
          <>
            <div>
              <Label htmlFor="interval" className="text-slate-300">
                Intervalo de Captura Automática
              </Label>
              <Select 
                value={captureInterval.toString()} 
                onValueChange={(val) => setCaptureInterval(Number(val))}
                disabled={isAutoCapture}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="1">Cada 1 segundo</SelectItem>
                  <SelectItem value="2">Cada 2 segundos</SelectItem>
                  <SelectItem value="3">Cada 3 segundos</SelectItem>
                  <SelectItem value="5">Cada 5 segundos</SelectItem>
                  <SelectItem value="10">Cada 10 segundos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              {!isAutoCapture ? (
                <>
                  <Button onClick={captureFrame} variant="outline" disabled={isProcessing}>
                    <Camera className="mr-2 h-4 w-4" />
                    Capturar Ahora
                  </Button>
                  <Button onClick={startAutoCapture} className="flex-1">
                    <Play className="mr-2 h-4 w-4" />
                    Iniciar Captura Automática
                  </Button>
                </>
              ) : (
                <Button onClick={stopAutoCapture} variant="destructive" className="flex-1">
                  <Square className="mr-2 h-4 w-4" />
                  Detener Captura Automática
                </Button>
              )}
            </div>
          </>
        )}

        {/* Info */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
          <div className="flex gap-2 text-sm text-blue-200">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Consejo:</strong> Para mejores resultados, asegúrate de que la placa esté bien iluminada 
              y enfocada. La detección automática procesará cada frame según el intervalo configurado.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
