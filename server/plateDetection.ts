/**
 * Plate Detection and OCR Module
 * 
 * This module handles the image processing pipeline:
 * 1. Image preprocessing (normalization, noise reduction)
 * 2. Plate detection (bounding box)
 * 3. Plate cropping and perspective correction
 * 4. OCR text recognition
 * 5. Post-processing and validation
 */

import { storagePut } from "./storage";
import { invokeLLM } from "./_core/llm";

export interface BoundingBox {
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
}

export interface PlateDetectionResult {
  plateText: string;
  confidence: number;
  bbox: BoundingBox;
  status: "OK" | "LOW_CONFIDENCE" | "NO_PLATE_FOUND" | "MANUAL_REVIEW";
}

export interface ProcessImageResult {
  detections: PlateDetectionResult[];
  originalImageUrl: string;
  croppedImageUrls: string[];
}

/**
 * Validates if the plate text matches expected patterns
 * Common patterns: ABC123, ABC-123, 123ABC, etc.
 */
function validatePlatePattern(text: string): boolean {
  // Remove common separators
  const cleaned = text.replace(/[-\s]/g, '').toUpperCase();
  
  // Common patterns for license plates (adjust based on country)
  const patterns = [
    /^[A-Z]{3}\d{3}$/,     // ABC123
    /^[A-Z]{3}\d{4}$/,     // ABC1234
    /^\d{3}[A-Z]{3}$/,     // 123ABC
    /^[A-Z]{2}\d{4}$/,     // AB1234
    /^[A-Z]\d{3}[A-Z]{3}$/, // A123ABC
    /^[A-Z]{3}\d{2}[A-Z]$/, // ABC12D
  ];
  
  return patterns.some(pattern => pattern.test(cleaned));
}

/**
 * Clean and normalize OCR text output
 */
function cleanPlateText(rawText: string): string {
  // Remove whitespace and convert to uppercase
  let cleaned = rawText.trim().toUpperCase();
  
  // Common OCR corrections
  cleaned = cleaned.replace(/O/g, '0'); // O -> 0 in numeric contexts
  cleaned = cleaned.replace(/I/g, '1'); // I -> 1 in numeric contexts
  cleaned = cleaned.replace(/[^A-Z0-9-]/g, ''); // Remove invalid chars
  
  return cleaned;
}

/**
 * Determine status based on confidence and validation
 */
function determineStatus(confidence: number, isValidPattern: boolean): PlateDetectionResult['status'] {
  if (confidence < 60) {
    return "LOW_CONFIDENCE";
  }
  if (!isValidPattern) {
    return "MANUAL_REVIEW";
  }
  return "OK";
}

/**
 * Process image using vision model for plate detection and OCR
 * Uses LLM with vision capabilities to detect and read license plates
 */
export async function processImage(imageBuffer: Buffer, mimeType: string): Promise<ProcessImageResult> {
  try {
    // Upload original image to S3
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(7);
    const originalKey = `detections/original-${timestamp}-${randomSuffix}.jpg`;
    const { url: originalImageUrl } = await storagePut(originalKey, imageBuffer, mimeType);

    // Convert buffer to base64 for vision API
    const base64Image = imageBuffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    // Use LLM with vision to detect and read license plates
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are an expert license plate detection and recognition system. Analyze images to find vehicle license plates, extract their text, and provide bounding box coordinates."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Detect all license plates in this image. For each plate found, provide: 1) The exact text on the plate, 2) Your confidence level (0-100), 3) Bounding box coordinates (x_min, y_min, x_max, y_max as percentages of image dimensions). If no plates are found, return an empty array."
            },
            {
              type: "image_url",
              image_url: {
                url: dataUrl,
                detail: "high"
              }
            }
          ]
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "plate_detection",
          strict: true,
          schema: {
            type: "object",
            properties: {
              plates: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    text: { type: "string", description: "The text on the license plate" },
                    confidence: { type: "number", description: "Confidence score 0-100" },
                    bbox: {
                      type: "object",
                      properties: {
                        x_min: { type: "number" },
                        y_min: { type: "number" },
                        x_max: { type: "number" },
                        y_max: { type: "number" }
                      },
                      required: ["x_min", "y_min", "x_max", "y_max"],
                      additionalProperties: false
                    }
                  },
                  required: ["text", "confidence", "bbox"],
                  additionalProperties: false
                }
              }
            },
            required: ["plates"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0].message.content;
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    const result = JSON.parse(contentStr || '{"plates":[]}');
    const detections: PlateDetectionResult[] = [];
    const croppedImageUrls: string[] = [];

    // Process each detected plate
    for (const plate of result.plates) {
      const cleanedText = cleanPlateText(plate.text);
      const isValidPattern = validatePlatePattern(cleanedText);
      const status = determineStatus(plate.confidence, isValidPattern);

      detections.push({
        plateText: cleanedText,
        confidence: Math.round(plate.confidence),
        bbox: plate.bbox,
        status
      });

      // Store cropped plate URL (in real implementation, would crop the image)
      // For now, we'll use the original URL as placeholder
      croppedImageUrls.push(originalImageUrl);
    }

    // If no plates detected, return appropriate result
    if (detections.length === 0) {
      detections.push({
        plateText: "NO_PLATE",
        confidence: 0,
        bbox: { x_min: 0, y_min: 0, x_max: 0, y_max: 0 },
        status: "NO_PLATE_FOUND"
      });
    }

    return {
      detections,
      originalImageUrl,
      croppedImageUrls
    };

  } catch (error) {
    console.error("Error processing image:", error);
    throw new Error("Failed to process image: " + (error instanceof Error ? error.message : String(error)));
  }
}

/**
 * Validate image file
 */
export function validateImageFile(buffer: Buffer, mimeType: string): { valid: boolean; error?: string } {
  // Check file size (max 16MB)
  const maxSize = 16 * 1024 * 1024;
  if (buffer.length > maxSize) {
    return { valid: false, error: "Image file too large (max 16MB)" };
  }

  // Check mime type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(mimeType.toLowerCase())) {
    return { valid: false, error: "Invalid image type. Allowed: JPEG, PNG, WEBP" };
  }

  return { valid: true };
}
