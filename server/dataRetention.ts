/**
 * Data Retention and Privacy Module
 * 
 * Handles automatic deletion of old detection records based on configured retention policy.
 * Ensures compliance with data privacy regulations.
 */

import { getDb, getSystemConfig, setSystemConfig } from './db';
import { detections } from '../drizzle/schema';
import { lt } from 'drizzle-orm';

export interface RetentionConfig {
  retentionDays: number;
  enabled: boolean;
  lastRun?: Date;
}

const DEFAULT_RETENTION_DAYS = 90;
const RETENTION_CONFIG_KEY = 'data_retention_policy';

/**
 * Get current retention configuration
 */
export async function getRetentionConfig(): Promise<RetentionConfig> {
  const config = await getSystemConfig(RETENTION_CONFIG_KEY);
  
  if (!config) {
    // Return default config
    return {
      retentionDays: DEFAULT_RETENTION_DAYS,
      enabled: true,
    };
  }
  
  return JSON.parse(config.configValue);
}

/**
 * Update retention configuration
 */
export async function updateRetentionConfig(config: RetentionConfig): Promise<void> {
  await setSystemConfig(
    RETENTION_CONFIG_KEY,
    JSON.stringify(config),
    'Data retention policy configuration'
  );
}

/**
 * Delete detection records older than retention period
 */
export async function cleanupOldRecords(): Promise<{ deleted: number; error?: string }> {
  try {
    const config = await getRetentionConfig();
    
    if (!config.enabled) {
      console.log('[DataRetention] Cleanup disabled in configuration');
      return { deleted: 0 };
    }
    
    const db = await getDb();
    if (!db) {
      return { deleted: 0, error: 'Database not available' };
    }
    
    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - config.retentionDays);
    
    console.log(`[DataRetention] Cleaning up records older than ${cutoffDate.toISOString()}`);
    
    // Delete old records
    const result = await db
      .delete(detections)
      .where(lt(detections.detectedAt, cutoffDate));
    
    const deletedCount = (result as any).rowsAffected || 0;
    
    // Update last run timestamp
    await updateRetentionConfig({
      ...config,
      lastRun: new Date(),
    });
    
    console.log(`[DataRetention] Deleted ${deletedCount} old records`);
    
    return { deleted: deletedCount };
  } catch (error) {
    console.error('[DataRetention] Error during cleanup:', error);
    return {
      deleted: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Schedule automatic cleanup (call this on server startup)
 */
export function scheduleAutomaticCleanup(): void {
  // Run cleanup every 24 hours
  const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  
  console.log('[DataRetention] Scheduling automatic cleanup every 24 hours');
  
  // Run immediately on startup
  setTimeout(() => {
    cleanupOldRecords().then(result => {
      if (result.error) {
        console.error('[DataRetention] Initial cleanup failed:', result.error);
      } else {
        console.log(`[DataRetention] Initial cleanup completed: ${result.deleted} records deleted`);
      }
    });
  }, 5000); // Wait 5 seconds after startup
  
  // Schedule recurring cleanup
  setInterval(() => {
    cleanupOldRecords().then(result => {
      if (result.error) {
        console.error('[DataRetention] Scheduled cleanup failed:', result.error);
      } else {
        console.log(`[DataRetention] Scheduled cleanup completed: ${result.deleted} records deleted`);
      }
    });
  }, CLEANUP_INTERVAL);
}

/**
 * Get statistics about data retention
 */
export async function getRetentionStats(): Promise<{
  totalRecords: number;
  oldestRecord?: Date;
  newestRecord?: Date;
  recordsToDelete: number;
}> {
  const db = await getDb();
  if (!db) {
    return { totalRecords: 0, recordsToDelete: 0 };
  }
  
  const config = await getRetentionConfig();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - config.retentionDays);
  
  // Get total count
  const totalResult = await db
    .select({ count: (await import('drizzle-orm')).sql<number>`count(*)` })
    .from(detections);
  const totalRecords = totalResult[0]?.count || 0;
  
  // Get oldest and newest records
  const oldestResult = await db
    .select({ date: detections.detectedAt })
    .from(detections)
    .orderBy(detections.detectedAt)
    .limit(1);
  const oldestRecord = oldestResult[0]?.date;
  
  const newestResult = await db
    .select({ date: detections.detectedAt })
    .from(detections)
    .orderBy((await import('drizzle-orm')).desc(detections.detectedAt))
    .limit(1);
  const newestRecord = newestResult[0]?.date;
  
  // Count records to be deleted
  const toDeleteResult = await db
    .select({ count: (await import('drizzle-orm')).sql<number>`count(*)` })
    .from(detections)
    .where(lt(detections.detectedAt, cutoffDate));
  const recordsToDelete = toDeleteResult[0]?.count || 0;
  
  return {
    totalRecords,
    oldestRecord,
    newestRecord,
    recordsToDelete,
  };
}
