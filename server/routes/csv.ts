import { Router, Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import Papa from "papaparse";
import { sendWhatsAppMessage, getOrderStatusMessage } from "../services/whatsapp";

dotenv.config({ path: "./server/.env" });

const router = Router();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

interface CSVMapperRequest {
  csvData: string; // Raw CSV text
  schemaId: string;
  columnMapping: Record<string, string>; // { csvColumnName: formFieldKey }
  importMode?: "preview" | "import"; // 'preview' = return parsed data; 'import' = actually create records
}

/**
 * POST /api/csv-mapper
 * Parse CSV and map columns to form fields; supports preview and bulk import
 */
router.post("/csv-mapper", async (req: Request, res: Response) => {
  try {
    const {
      csvData,
      schemaId,
      columnMapping,
      importMode = "preview",
    } = req.body as CSVMapperRequest;
    const smeId = req.headers["x-sme-id"] as string;

    if (!smeId) {
      return res
        .status(401)
        .json({ success: false, error: "SME ID not provided" });
    }

    if (!csvData || !schemaId || !columnMapping) {
      return res
        .status(400)
        .json({
          success: false,
          error: "csvData, schemaId, and columnMapping are required",
        });
    }

    // Verify SME owns the schema (Skip if standard import)
    if (schemaId !== 'STANDARD_IMPORT') {
      const { data: schema, error: schemaError } = await supabase
        .from("form_schemas")
        .select("id")
        .eq("id", schemaId)
        .eq("sme_id", smeId)
        .single();

      if (schemaError || !schema) {
        return res
          .status(403)
          .json({ success: false, error: "Schema not found or unauthorized" });
      }
    }

    // Parse CSV using PapaParse
    const parsed = Papa.parse(csvData, {
      header: true, // First row is headers
      skipEmptyLines: true,
      dynamicTyping: false,
    });

    if (parsed.errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Failed to parse CSV",
        details: parsed.errors.map((e: any) => e.message),
      });
    }

    const rows = parsed.data as any[];

    // Map CSV rows to Order Stucture
    const mappedRows = rows.map((row) => {
      // 1. Identify Core Fields 
      // Logic: Find which CSV column map to 'customer_name', etc.
      const getMappedValue = (targetKey: string) => {
        const csvHeaderName = Object.keys(columnMapping).find(key => columnMapping[key] === targetKey);
        return csvHeaderName && row[csvHeaderName] !== undefined ? row[csvHeaderName] : null;
      }

      const customer_name = getMappedValue('customer_name');
      const customer_phone = getMappedValue('customer_phone');
      const delivery_address = getMappedValue('delivery_address');
      const price_total = Number(getMappedValue('price_total') || 0);

      // 2. Identify Custom Fields (Everything else)
      const customData: Record<string, any> = {};
      const systemKeys = ['customer_name', 'customer_phone', 'delivery_address', 'price_total'];

      // Iterate over the mapping. If the target field is NOT a system key, it's custom data.
      Object.entries(columnMapping).forEach(([csvHeader, targetField]) => {
        if (!systemKeys.includes(targetField as string) && row[csvHeader] !== undefined) {
          // If we mapped it to a custom key, use it
          customData[targetField as string] = row[csvHeader];
        }
      });

      return {
        customer_name,
        customer_phone,
        delivery_address,
        price_total,
        form_data: customData, // JSONB bucket
        original_row: row // Keep for debugging if needed
      };
    });

    // If preview mode, just return the mapped data
    if (importMode === "preview") {
      return res.json({
        success: true,
        rowCount: mappedRows.length,
        sampleRows: mappedRows.slice(0, 5),
        mappedRows,
      });
    }

    if (importMode === "import") {
      // 1. Filter out invalid rows (missing required name/phone?) - Optional, but let's be safe
      const validRows = mappedRows.filter(r => r.customer_name && r.customer_phone);

      if (validRows.length === 0) {
        return res.status(400).json({ success: false, error: "No valid rows found. Ensure Name and Phone are mapped." });
      }

      // 2. Prepare the array for bulk insert into ORDERS table
      const timestamp = Date.now().toString().slice(-6);

      const ordersToInsert = validRows.map((data, idx) => ({
        sme_id: smeId,
        readable_id: `BLK${timestamp}${idx}`, // Unique-ish ID
        status: 'NEW',
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        delivery_address: data.delivery_address || 'Imported Address', // Fallback
        price_total: data.price_total,
        form_data: data.form_data,
        created_at: new Date().toISOString()
      }));

      // 3. Perform ONE bulk insert
      const { data, error: insertError } = await supabase
        .from("orders")
        .insert(ordersToInsert)
        .select();

      if (insertError) {
        console.error("[CSV Import] Bulk insert error:", insertError);
        return res
          .status(500)
          .json({ success: false, error: "Failed to bulk import orders: " + insertError.message });
      }

      // 4. Send WhatsApp Notifications (Fire and Forget)
      if (data && data.length > 0) {
        // We use Promise.allSettled to ensure all messages are attempted even if some fail
        // Using `void` to explicitly ignore the promise so we don't wait for it
        void Promise.allSettled(data.map(async (order: any) => {
          if (order.customer_phone) {
            const messageText = getOrderStatusMessage('NEW', order.readable_id);
            await sendWhatsAppMessage({
              phone: order.customer_phone,
              message: messageText,
              orderId: order.id,
              smeId: smeId
            });
          }
        }));
      }

      return res.json({
        success: true,
        message: `Successfully created ${ordersToInsert.length} orders`,
        successCount: ordersToInsert.length,
      });
    }

    return res
      .status(400)
      .json({ success: false, error: "Invalid importMode" });
  } catch (error) {
    console.error("[CSV Mapper] Error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /api/csv-mapper/auto-detect
 * Auto-detect column names and suggest field mappings
 */
router.post("/csv-mapper/auto-detect", async (req: Request, res: Response) => {
  try {
    const { csvData, schemaId } = req.body;
    const smeId = req.headers["x-sme-id"] as string;

    if (!smeId) {
      return res
        .status(401)
        .json({ success: false, error: "SME ID not provided" });
    }

    if (!csvData || !schemaId) {
      return res
        .status(400)
        .json({ success: false, error: "csvData and schemaId are required" });
    }

    // Parse CSV to get headers
    const parsed = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      preview: 1, // Just parse first row to get headers
    });

    const csvHeaders = Object.keys((parsed.data as any[])[0] || {});

    // Fetch form schema fields
    const { data: fields, error: fieldsError } = await supabase
      .from("form_fields")
      .select("field_key, label")
      .eq("schema_id", schemaId);

    if (fieldsError) {
      return res
        .status(500)
        .json({ success: false, error: "Failed to fetch form fields" });
    }

    // Simple auto-detection: match CSV headers to form field labels (case-insensitive)
    const suggestions: Record<string, string> = {};
    const fieldMap = new Map(
      fields?.map((f: any) => [f.label.toLowerCase(), f.field_key]) || []
    );

    for (const csvHeader of csvHeaders) {
      const normalized = csvHeader.toLowerCase();

      const match = fields?.find(
        (f) =>
          f.label.toLowerCase() === normalized ||
          f.field_key.toLowerCase() === normalized
      );
      if (match) {
        suggestions[csvHeader] = match.field_key;
      }
    }

    return res.json({
      success: true,
      csvHeaders,
      formFields: fields || [],
      suggestions,
    });
  } catch (error) {
    console.error("[CSV Auto-Detect] Error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
});

export default router;
