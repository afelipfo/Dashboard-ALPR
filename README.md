# Sistema de Detección y Reconocimiento de Placas Vehiculares (ALPR)

Sistema completo de detección automática de placas vehiculares utilizando visión por computadora y OCR, con dashboard web para visualización y gestión de registros. **Ahora con soporte para detección en tiempo real desde cámara web.**

## Características Principales

### Detección y Reconocimiento
- **Detección automática** de placas en imágenes mediante modelos de visión por computadora
- **Detección en tiempo real** desde cámara web con captura automática de frames
- **OCR de alta precisión** para reconocimiento de texto alfanumérico
- **Scores de confianza** para cada detección (0-100%)
- **Validación de patrones** de placa según formatos estándar
- **Soporte para múltiples placas** en una misma imagen

### Modos de Captura

#### 1. Upload de Imagen Estática
- Subir imágenes desde dispositivo (JPEG, PNG, WEBP)
- Procesamiento único de imagen
- Ideal para análisis forense o procesamiento por lotes

#### 2. Cámara en Tiempo Real ⭐ NUEVO
- Acceso directo a cámara web del dispositivo
- Preview de video en vivo
- Captura automática de frames cada 1-10 segundos (configurable)
- Procesamiento continuo sin intervención manual
- Selector de cámara (frontal/trasera en móviles)
- Indicadores visuales de estado (EN VIVO, Procesando, Countdown)
- Ideal para control de acceso vehicular en tiempo real

### Dashboard Web
- **Tabla de registros** con filtros avanzados (placa, fecha, estado, confianza)
- **Vista de detalle** con imagen original y recorte de placa
- **Estadísticas en tiempo real** (total, promedio de confianza, por estado)
- **Selector de modo** entre upload y cámara en tiempo real
- **Paginación** de resultados

### Privacidad y Cumplimiento
- **Retención configurable** de datos (1-365 días)
- **Borrado automático** de registros antiguos cada 24 horas
- **Auditoría de accesos** a registros sensibles
- **Avisos legales** sobre protección de datos personales
- **Cumplimiento GDPR/LOPD**

### API REST
- **Endpoints tRPC** con tipado end-to-end
- **Autenticación OAuth** integrada
- **Documentación completa** de API
- **Manejo de errores** robusto

## Stack Tecnológico

### Backend
- **Node.js** con TypeScript
- **Express** + **tRPC** para API
- **Drizzle ORM** con MySQL/TiDB
- **LLM con visión** para detección y OCR
- **S3** para almacenamiento de imágenes

### Frontend
- **React 19** con TypeScript
- **Tailwind CSS 4** para estilos
- **shadcn/ui** para componentes
- **Wouter** para routing
- **TanStack Query** (vía tRPC)
- **MediaDevices API** para acceso a cámara

### Infraestructura
- **Manus OAuth** para autenticación
- **Manus Storage** (S3) para imágenes
- **Manus LLM** para procesamiento de visión
- **MySQL/TiDB** para base de datos

## Instalación y Configuración

### Requisitos Previos
- Node.js 22+
- pnpm
- Acceso a base de datos MySQL/TiDB
- Credenciales de Manus (automáticas en plataforma)
- **Cámara web** (para modo de tiempo real)

### Instalación

```bash
# Instalar dependencias
pnpm install

# Aplicar migraciones de base de datos
pnpm db:push

# Iniciar servidor de desarrollo
pnpm dev
```

### Variables de Entorno

Las siguientes variables son inyectadas automáticamente por la plataforma Manus:

- `DATABASE_URL` - Conexión a base de datos
- `JWT_SECRET` - Secret para sesiones
- `VITE_APP_ID` - ID de aplicación OAuth
- `OAUTH_SERVER_URL` - URL del servidor OAuth
- `BUILT_IN_FORGE_API_URL` - URL de APIs de Manus
- `BUILT_IN_FORGE_API_KEY` - Token de autenticación

## Uso

### 1. Modo Upload de Imagen

1. Acceder al dashboard en `/dashboard`
2. Hacer clic en "Procesar Imagen"
3. Seleccionar pestaña "Subir Imagen"
4. Seleccionar una imagen de vehículo (JPEG, PNG, WEBP, máx 16MB)
5. El sistema procesará automáticamente y mostrará resultados

### 2. Modo Cámara en Tiempo Real ⭐ NUEVO

1. Acceder al dashboard en `/dashboard`
2. Hacer clic en "Procesar Imagen"
3. Seleccionar pestaña "Cámara en Tiempo Real"
4. Permitir acceso a la cámara cuando el navegador lo solicite
5. Hacer clic en "Iniciar Cámara"
6. Configurar intervalo de captura automática (1-10 segundos)
7. Hacer clic en "Iniciar Captura Automática"
8. El sistema procesará frames automáticamente y mostrará resultados en tiempo real

**Consejos para mejor rendimiento:**
- Asegurar buena iluminación
- Mantener la placa enfocada y visible
- Usar intervalos de 3-5 segundos para evitar sobrecarga
- En móviles, usar cámara trasera para mejor calidad

### 3. Ver Registros

- La tabla principal muestra todos los registros de detección
- Usar filtros para buscar por placa, estado, confianza o fecha
- Hacer clic en el ícono de ojo para ver detalles completos

### 4. Configurar Retención

1. Ir a "Configuración" (ícono de engranaje)
2. Ajustar días de retención (recomendado: 30-90 días)
3. Habilitar/deshabilitar limpieza automática
4. Ver estadísticas de retención

### 5. Interpretar Resultados

#### Estados de Detección

- **OK** (verde): Detección exitosa con alta confianza (≥60%) y patrón válido
- **Baja Confianza** (amarillo): Confianza <60%, revisar manualmente
- **Revisión Manual** (naranja): Patrón no válido, verificar
- **Sin Placa** (rojo): No se detectó placa en la imagen

#### Scores de Confianza

- **80-100%**: Excelente, usar directamente
- **60-79%**: Bueno, verificar en casos críticos
- **<60%**: Bajo, requiere revisión manual

## Casos de Uso

### Control Vehicular en Tiempo Real ⭐
Monitoreo continuo de accesos en parqueaderos, patios y zonas restringidas. Registro automático de entrada/salida sin intervención humana. La cámara captura y procesa placas automáticamente.

### Registro de Infracciones
Detección de cruces en rojo, violaciones de pico y placa, invasión de carril. Evidencia fotográfica con timestamp.

### Analítica de Flujo
Conteo de placas únicas por intervalo de tiempo. Análisis de patrones de tráfico vehicular. Estadísticas en tiempo real.

### Punto de Control de Seguridad
Verificación automática de vehículos autorizados vs lista negra. Alertas inmediatas ante detecciones sospechosas.

## Arquitectura del Sistema

### Pipeline de Procesamiento

1. **Ingesta de imagen** - Upload vía interfaz web o captura desde cámara
2. **Preprocesamiento** - Normalización y optimización
3. **Detección de placa** - Localización de bounding box
4. **Crop de placa** - Extracción de región de interés
5. **OCR** - Reconocimiento de texto alfanumérico
6. **Post-procesamiento** - Limpieza y validación de texto
7. **Persistencia** - Almacenamiento en DB con metadatos
8. **Exposición** - Disponible vía API y dashboard

### Flujo de Datos (Modo Tiempo Real)

```
Cámara Web → MediaStream → Canvas Capture → Base64 Encoding
                                                    ↓
Usuario ← Dashboard ← Database ← Procesamiento ML ← tRPC API
                         ↓
                    S3 Storage
```

## Métricas y Monitoreo

### Métricas Disponibles

- **Total de detecciones** - Contador acumulado
- **Detecciones hoy** - Contador diario
- **Confianza promedio** - Media de scores
- **Distribución por estado** - OK, baja confianza, revisión, sin placa
- **Registros a eliminar** - Por política de retención

### Logs

El sistema registra automáticamente:
- Procesamiento de imágenes
- Capturas desde cámara en tiempo real
- Accesos a registros (auditoría)
- Eliminaciones de registros
- Limpiezas automáticas
- Errores de procesamiento

## Consideraciones Técnicas

### Requisitos de Navegador para Cámara en Tiempo Real

**Navegadores Soportados:**
- Chrome/Edge 53+
- Firefox 36+
- Safari 11+
- Opera 40+

**Permisos Requeridos:**
- Acceso a cámara (getUserMedia)
- Conexión HTTPS (requerido por navegadores modernos)

**Limitaciones:**
- Algunos navegadores pueden requerir interacción del usuario antes de acceder a la cámara
- En iOS Safari, la funcionalidad puede estar limitada en modo privado
- La calidad del stream depende de las capacidades de la cámara del dispositivo

### Optimizaciones de Rendimiento

**Modo Tiempo Real:**
- Frames capturados en JPEG con calidad 90% para balance tamaño/calidad
- Intervalo configurable para evitar sobrecarga del servidor
- Liberación automática de recursos de cámara al cerrar
- Procesamiento asíncrono sin bloqueo de UI

## Consideraciones Legales

### Protección de Datos

Las placas vehiculares son **datos personales** asociados a bienes registrables. Su tratamiento está regulado por:

- **GDPR** (Unión Europea)
- **LOPD** (España)
- Normativas locales de protección de datos

### Responsabilidades

1. **Retención limitada** - Configure tiempos según normativa local
2. **Propósito específico** - Use solo para fines declarados
3. **Acceso controlado** - Solo personal autorizado
4. **Auditoría** - Todos los accesos son registrados
5. **Borrado seguro** - Eliminación automática de datos antiguos
6. **Consentimiento** - Informar sobre videovigilancia cuando aplique

### Uso Sancionatorio

Para uso en multas o control sancionatorio:
- Requiere autorización de autoridad competente
- Debe mantener cadena de custodia de evidencia
- Cumplir requisitos de validez probatoria

## Patrones de Placa Soportados

El sistema reconoce los siguientes formatos:

- `ABC123` - 3 letras + 3 números
- `ABC1234` - 3 letras + 4 números
- `123ABC` - 3 números + 3 letras
- `AB1234` - 2 letras + 4 números
- `A123ABC` - 1 letra + 3 números + 3 letras
- `ABC12D` - 3 letras + 2 números + 1 letra

Los separadores (guiones, espacios) son ignorados automáticamente.

## Limitaciones Conocidas

1. **Calidad de imagen** - Requiere imágenes claras con buena iluminación
2. **Ángulo de captura** - Mejor rendimiento con ángulos frontales/traseros
3. **Oclusiones** - Placas parcialmente ocultas reducen precisión
4. **Formatos especiales** - Placas diplomáticas o especiales pueden no validarse
5. **Idioma** - Optimizado para caracteres alfanuméricos latinos
6. **Velocidad en tiempo real** - Vehículos en movimiento rápido pueden generar blur

## Roadmap

### Hito 1: PoC Local ✅
- Detección + OCR en imagen única
- Validación de patrones
- API básica

### Hito 2: MVP Operativo ✅
- Dashboard web completo
- Filtros y búsquedas
- Retención de datos
- Auditoría

### Hito 3: Detección en Tiempo Real ✅
- Captura desde cámara web
- Procesamiento automático de frames
- Selector de intervalo configurable
- Indicadores visuales de estado

### Hito 4: Versión Avanzada (Futuro)
- Stream de video RTSP/IP cameras
- Alertas automáticas por lista negra/blanca
- Integración con sistemas externos (barreras, alarmas)
- Dashboard de analítica avanzada
- Exportación de reportes PDF/Excel

## Mantenimiento

### Limpieza de Datos

El sistema ejecuta automáticamente limpieza cada 24 horas si está habilitado. También puede ejecutarse manualmente desde "Configuración".

### Backups

Recomendado:
- Backup diario de base de datos
- Backup semanal de imágenes en S3
- Retención de backups según política organizacional

### Actualizaciones

Para actualizar el sistema:

```bash
# Actualizar dependencias
pnpm update

# Aplicar nuevas migraciones
pnpm db:push

# Reiniciar servidor
pnpm dev
```

## Troubleshooting

### La cámara no inicia
- Verificar permisos del navegador
- Asegurar conexión HTTPS
- Probar en navegador diferente
- Verificar que ninguna otra aplicación esté usando la cámara

### Procesamiento lento en tiempo real
- Aumentar intervalo de captura (5-10 segundos)
- Verificar conexión a internet
- Reducir resolución de cámara si es posible

### Detecciones con baja confianza
- Mejorar iluminación
- Acercar cámara a la placa
- Limpiar lente de la cámara
- Asegurar que placa esté enfocada

## Soporte

Para preguntas técnicas, reportar bugs o solicitar funcionalidades:
- Revisar documentación de API en `API_DOCUMENTATION.md`
- Consultar logs del servidor
- Contactar al administrador del sistema

## Licencia

Este proyecto es propiedad del titular de la cuenta Manus y está sujeto a los términos de servicio de la plataforma.

---

**Versión:** 2.0.0  
**Última actualización:** Noviembre 2025  
**Nueva funcionalidad:** Detección en tiempo real desde cámara web ⭐
