import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Plate detection routers
  detections: router({
    // Upload and process image for plate detection
    uploadImage: protectedProcedure
      .input(z.object({
        imageData: z.string(), // base64 encoded image
        mimeType: z.string(),
        cameraId: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { processImage, validateImageFile } = await import('./plateDetection');
        const { createDetection, createAuditLog } = await import('./db');
        
        // Convert base64 to buffer
        const buffer = Buffer.from(input.imageData, 'base64');
        
        // Validate image
        const validation = validateImageFile(buffer, input.mimeType);
        if (!validation.valid) {
          throw new Error(validation.error);
        }
        
        // Process image
        const result = await processImage(buffer, input.mimeType);
        
        // Save detections to database
        const savedDetections = [];
        for (let i = 0; i < result.detections.length; i++) {
          const detection = result.detections[i];
          const insertResult = await createDetection({
            plateText: detection.plateText,
            confidence: detection.confidence,
            bbox: JSON.stringify(detection.bbox),
            originalImageUrl: result.originalImageUrl,
            croppedImageUrl: result.croppedImageUrls[i] || null,
            status: detection.status,
            cameraId: input.cameraId || null,
            userId: ctx.user.id,
            detectedAt: new Date(),
          });
          
          // Get the inserted ID from the result
          const insertId = (insertResult as any).insertId || 0;
          savedDetections.push({
            id: insertId,
            ...detection,
          });
        }
        
        return {
          success: true,
          detections: savedDetections,
          originalImageUrl: result.originalImageUrl,
        };
      }),
    
    // List detections with pagination and filters
    list: protectedProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        plateText: z.string().optional(),
        status: z.enum(['OK', 'LOW_CONFIDENCE', 'NO_PLATE_FOUND', 'MANUAL_REVIEW']).optional(),
        minConfidence: z.number().min(0).max(100).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        cameraId: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const { getDb } = await import('./db');
        const { detections } = await import('../drizzle/schema');
        const { and, gte, lte, like, eq, desc, sql } = await import('drizzle-orm');
        
        const db = await getDb();
        if (!db) return { detections: [], total: 0 };
        
        // Build where conditions
        const conditions = [];
        if (input.plateText) {
          conditions.push(like(detections.plateText, `%${input.plateText}%`));
        }
        if (input.status) {
          conditions.push(eq(detections.status, input.status));
        }
        if (input.minConfidence !== undefined) {
          conditions.push(gte(detections.confidence, input.minConfidence));
        }
        if (input.startDate) {
          conditions.push(gte(detections.detectedAt, input.startDate));
        }
        if (input.endDate) {
          conditions.push(lte(detections.detectedAt, input.endDate));
        }
        if (input.cameraId) {
          conditions.push(eq(detections.cameraId, input.cameraId));
        }
        
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
        
        // Get total count
        const countResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(detections)
          .where(whereClause);
        const total = countResult[0]?.count || 0;
        
        // Get paginated results
        const results = await db
          .select()
          .from(detections)
          .where(whereClause)
          .orderBy(desc(detections.detectedAt))
          .limit(input.limit)
          .offset(input.offset);
        
        return {
          detections: results,
          total,
          hasMore: input.offset + input.limit < total,
        };
      }),
    
    // Get single detection by ID
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const { getDetectionById, createAuditLog } = await import('./db');
        
        const detection = await getDetectionById(input.id);
        
        if (detection) {
          // Log access
          await createAuditLog({
            userId: ctx.user.id,
            detectionId: detection.id,
            action: 'VIEW',
            ipAddress: ctx.req.ip || null,
            actionAt: new Date(),
          });
        }
        
        return detection;
      }),
    
    // Delete detection
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { deleteDetection, createAuditLog } = await import('./db');
        
        // Log deletion
        await createAuditLog({
          userId: ctx.user.id,
          detectionId: input.id,
          action: 'DELETE',
          ipAddress: ctx.req.ip || null,
          actionAt: new Date(),
        });
        
        await deleteDetection(input.id);
        
        return { success: true };
      }),
    
    // Get statistics
    stats: protectedProcedure.query(async () => {
      const { getDb } = await import('./db');
      const { detections } = await import('../drizzle/schema');
      const { sql, gte } = await import('drizzle-orm');
      
      const db = await getDb();
      if (!db) return null;
      
      // Get total detections
      const totalResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(detections);
      const total = totalResult[0]?.count || 0;
      
      // Get average confidence
      const avgResult = await db
        .select({ avg: sql<number>`avg(${detections.confidence})` })
        .from(detections);
      const avgConfidence = avgResult[0]?.avg || 0;
      
      // Get detections by status
      const statusResult = await db
        .select({
          status: detections.status,
          count: sql<number>`count(*)`
        })
        .from(detections)
        .groupBy(detections.status);
      
      // Get today's detections
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(detections)
        .where(gte(detections.detectedAt, today));
      const todayCount = todayResult[0]?.count || 0;
      
      return {
        total,
        avgConfidence: Math.round(avgConfidence),
        byStatus: statusResult,
        today: todayCount,
      };
    }),
  }),
  
  // System configuration
  config: router({
    get: protectedProcedure
      .input(z.object({ key: z.string() }))
      .query(async ({ input }) => {
        const { getSystemConfig } = await import('./db');
        return await getSystemConfig(input.key);
      }),
    
    set: protectedProcedure
      .input(z.object({
        key: z.string(),
        value: z.string(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { setSystemConfig } = await import('./db');
        await setSystemConfig(input.key, input.value, input.description);
        return { success: true };
      }),
  }),
  
  // Data retention and privacy
  retention: router({
    getConfig: protectedProcedure.query(async () => {
      const { getRetentionConfig } = await import('./dataRetention');
      return await getRetentionConfig();
    }),
    
    updateConfig: protectedProcedure
      .input(z.object({
        retentionDays: z.number().min(1).max(365),
        enabled: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        const { updateRetentionConfig } = await import('./dataRetention');
        await updateRetentionConfig(input);
        return { success: true };
      }),
    
    getStats: protectedProcedure.query(async () => {
      const { getRetentionStats } = await import('./dataRetention');
      return await getRetentionStats();
    }),
    
    runCleanup: protectedProcedure.mutation(async () => {
      const { cleanupOldRecords } = await import('./dataRetention');
      return await cleanupOldRecords();
    }),
  }),
});

export type AppRouter = typeof appRouter;
