# Documentación de API - Sistema ALPR

## Descripción General

Este documento describe la API REST del Sistema de Detección y Reconocimiento de Placas Vehiculares (ALPR). La API está construida con tRPC y proporciona endpoints para procesamiento de imágenes, gestión de detecciones y configuración del sistema.

## Autenticación

Todos los endpoints requieren autenticación mediante OAuth de Manus. El usuario debe estar autenticado para acceder a cualquier funcionalidad.

## Endpoints Principales

### 1. Detecciones

#### `detections.uploadImage`

Sube y procesa una imagen para detectar placas vehiculares.

**Tipo:** Mutation

**Input:**
```typescript
{
  imageData: string;      // Imagen en base64 (sin prefijo data:image/...)
  mimeType: string;       // Tipo MIME: 'image/jpeg', 'image/png', 'image/webp'
  cameraId?: string;      // Identificador opcional de cámara/origen
}
```

**Output:**
```typescript
{
  success: boolean;
  detections: Array<{
    id: number;
    plateText: string;
    confidence: number;    // 0-100
    bbox: {
      x_min: number;
      y_min: number;
      x_max: number;
      y_max: number;
    };
    status: 'OK' | 'LOW_CONFIDENCE' | 'NO_PLATE_FOUND' | 'MANUAL_REVIEW';
  }>;
  originalImageUrl: string;
}
```

**Ejemplo de Respuesta Exitosa (1 placa):**
```json
{
  "success": true,
  "detections": [
    {
      "id": 123,
      "plateText": "ABC123",
      "confidence": 95,
      "bbox": {
        "x_min": 120.5,
        "y_min": 200.3,
        "x_max": 280.7,
        "y_max": 250.9
      },
      "status": "OK"
    }
  ],
  "originalImageUrl": "https://storage.example.com/detections/original-123.jpg"
}
```

**Ejemplo de Respuesta (0 placas detectadas):**
```json
{
  "success": true,
  "detections": [
    {
      "id": 124,
      "plateText": "NO_PLATE",
      "confidence": 0,
      "bbox": {
        "x_min": 0,
        "y_min": 0,
        "x_max": 0,
        "y_max": 0
      },
      "status": "NO_PLATE_FOUND"
    }
  ],
  "originalImageUrl": "https://storage.example.com/detections/original-124.jpg"
}
```

**Ejemplo de Respuesta (múltiples placas):**
```json
{
  "success": true,
  "detections": [
    {
      "id": 125,
      "plateText": "ABC123",
      "confidence": 92,
      "bbox": { "x_min": 100, "y_min": 150, "x_max": 250, "y_max": 200 },
      "status": "OK"
    },
    {
      "id": 126,
      "plateText": "XYZ789",
      "confidence": 88,
      "bbox": { "x_min": 400, "y_min": 180, "x_max": 550, "y_max": 230 },
      "status": "OK"
    }
  ],
  "originalImageUrl": "https://storage.example.com/detections/original-125.jpg"
}
```

**Validaciones:**
- Tamaño máximo de imagen: 16MB
- Formatos permitidos: JPEG, PNG, WEBP
- La imagen debe ser válida y decodificable

---

#### `detections.list`

Lista registros de detección con filtros y paginación.

**Tipo:** Query

**Input:**
```typescript
{
  limit?: number;          // 1-100, default: 50
  offset?: number;         // default: 0
  plateText?: string;      // Búsqueda parcial por texto de placa
  status?: 'OK' | 'LOW_CONFIDENCE' | 'NO_PLATE_FOUND' | 'MANUAL_REVIEW';
  minConfidence?: number;  // 0-100
  startDate?: Date;        // Fecha inicio (inclusive)
  endDate?: Date;          // Fecha fin (inclusive)
  cameraId?: string;       // Filtrar por cámara específica
}
```

**Output:**
```typescript
{
  detections: Array<Detection>;
  total: number;
  hasMore: boolean;
}
```

---

#### `detections.getById`

Obtiene el detalle completo de una detección específica.

**Tipo:** Query

**Input:**
```typescript
{
  id: number;
}
```

**Output:**
```typescript
Detection | undefined
```

**Nota:** Este endpoint registra el acceso en la tabla de auditoría.

---

#### `detections.delete`

Elimina un registro de detección.

**Tipo:** Mutation

**Input:**
```typescript
{
  id: number;
}
```

**Output:**
```typescript
{
  success: boolean;
}
```

**Nota:** Este endpoint registra la eliminación en la tabla de auditoría.

---

#### `detections.stats`

Obtiene estadísticas generales del sistema.

**Tipo:** Query

**Output:**
```typescript
{
  total: number;              // Total de detecciones
  avgConfidence: number;      // Confianza promedio (0-100)
  byStatus: Array<{
    status: string;
    count: number;
  }>;
  today: number;              // Detecciones de hoy
}
```

---

### 2. Retención de Datos

#### `retention.getConfig`

Obtiene la configuración actual de retención de datos.

**Tipo:** Query

**Output:**
```typescript
{
  retentionDays: number;
  enabled: boolean;
  lastRun?: Date;
}
```

---

#### `retention.updateConfig`

Actualiza la configuración de retención de datos.

**Tipo:** Mutation

**Input:**
```typescript
{
  retentionDays: number;    // 1-365
  enabled: boolean;
}
```

**Output:**
```typescript
{
  success: boolean;
}
```

---

#### `retention.getStats`

Obtiene estadísticas sobre retención de datos.

**Tipo:** Query

**Output:**
```typescript
{
  totalRecords: number;
  oldestRecord?: Date;
  newestRecord?: Date;
  recordsToDelete: number;
}
```

---

#### `retention.runCleanup`

Ejecuta manualmente la limpieza de registros antiguos.

**Tipo:** Mutation

**Output:**
```typescript
{
  deleted: number;
  error?: string;
}
```

---

## Patrones de Placa Soportados

El sistema valida las placas detectadas contra los siguientes patrones comunes:

1. **ABC123** - 3 letras + 3 números
2. **ABC1234** - 3 letras + 4 números
3. **123ABC** - 3 números + 3 letras
4. **AB1234** - 2 letras + 4 números
5. **A123ABC** - 1 letra + 3 números + 3 letras
6. **ABC12D** - 3 letras + 2 números + 1 letra

Los separadores como guiones y espacios son ignorados durante la validación.

---

## Estados de Detección

### OK
- Confianza ≥ 60%
- Patrón de placa válido
- Listo para uso en producción

### LOW_CONFIDENCE
- Confianza < 60%
- Requiere revisión manual
- Puede contener errores de OCR

### MANUAL_REVIEW
- El texto no coincide con patrones válidos
- Puede ser una placa de formato especial
- Requiere validación humana

### NO_PLATE_FOUND
- No se detectó ninguna placa en la imagen
- Puede deberse a:
  - Imagen sin vehículos
  - Placa no visible
  - Calidad de imagen insuficiente

---

## Umbrales Recomendados

### Para Piloto
- **mAP@0.5:** ≥ 0.70
- **Exact Match Accuracy:** ≥ 70%
- **Latencia:** < 2 segundos por imagen

### Para Producción
- **mAP@0.5:** ≥ 0.85
- **Exact Match Accuracy:** ≥ 85%
- **Latencia:** < 1 segundo por imagen

---

## Consideraciones de Privacidad

1. **Retención de Datos:** Configure tiempos de retención según normativas locales (GDPR/LOPD)
2. **Auditoría:** Todos los accesos a registros son auditados automáticamente
3. **Borrado Automático:** El sistema elimina registros antiguos cada 24 horas si está habilitado
4. **Uso Sancionatorio:** Requiere alineación con autoridad competente y cadena de custodia

---

## Códigos de Error Comunes

- **Image too large:** Archivo mayor a 16MB
- **Invalid image type:** Formato no soportado
- **Failed to process image:** Error en el procesamiento de ML
- **Database not available:** Error de conexión a base de datos
- **Unauthorized:** Usuario no autenticado

---

## Límites y Restricciones

- **Tamaño máximo de imagen:** 16MB
- **Formatos soportados:** JPEG, PNG, WEBP
- **Límite de paginación:** 100 registros por página
- **Retención máxima:** 365 días
- **Retención mínima:** 1 día

---

## Ejemplo de Integración (Frontend)

```typescript
import { trpc } from '@/lib/trpc';

// Subir y procesar imagen
const uploadMutation = trpc.detections.uploadImage.useMutation({
  onSuccess: (data) => {
    console.log(`Detectadas ${data.detections.length} placas`);
    data.detections.forEach(det => {
      console.log(`Placa: ${det.plateText}, Confianza: ${det.confidence}%`);
    });
  }
});

// Convertir archivo a base64 y enviar
const handleUpload = async (file: File) => {
  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64 = e.target?.result as string;
    const base64Data = base64.split(',')[1];
    
    await uploadMutation.mutateAsync({
      imageData: base64Data,
      mimeType: file.type,
    });
  };
  reader.readAsDataURL(file);
};

// Listar detecciones con filtros
const { data } = trpc.detections.list.useQuery({
  limit: 20,
  status: 'OK',
  minConfidence: 80,
});
```

---

## Soporte y Contacto

Para preguntas técnicas o reportar problemas, contacte al administrador del sistema.
