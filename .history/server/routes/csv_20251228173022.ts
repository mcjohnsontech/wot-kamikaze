import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import Papa from 'papaparse';

dotenv.config({ path: './server/.env' });

const router = Router();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

interface CSVMapperRequest {
  csvData: string; // Raw CSV text
  schemaId: string;
  columnMapping: Record<string, string>; // { csvColumnName: formFieldKey }
  importMode?: 'preview' | 'import'; // 'preview' = return parsed data; 'import' = actually create records
}

/**
 * POST /api/csv-mapper
 * Parse CSV and map columns to form fields; supports preview and bulk import
 */
router.post('/csv-mapper', async (req: Request, res: Response) => {
  try {
    const { csvData, schemaId, columnMapping, importMode = 'preview' } = req.body as CSVMapperRequest;
    const smeId = req.headers['x-sme-id'] as string;

    if (!smeId) {
      return res.status(401).json({ success: false, error: 'SME ID not provided' });
    }

    if (!csvData || !schemaId || !columnMapping) {
      return res.status(400).json({ success: false, error: 'csvData, schemaId, and columnMapping are required' });
    }

    // Verify SME owns the schema
    const { data: schema, error: schemaError } = await supabase
      .from('form_schemas')
      .select('id')
      .eq('id', schemaId)
      .eq('sme_id', smeId)
      .single();

    if (schemaError || !schema) {
      return res.status(403).json({ success: false, error: 'Schema not found or unauthorized' });
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
        error: 'Failed to parse CSV',
        details: parsed.errors.map((e: any) => e.message),
      });
    }

    const rows = parsed.data as any[];

    // Map CSV rows to form data using columnMapping
    const mappedRows = rows.map((row) => {
      const mappedData: Record<string, any> = {};

      for (const [csvCol, formField] of Object.entries(columnMapping)) {
        if (row[csvCol] !== undefined && row[csvCol] !== null && row[csvCol] !== '') {
          mappedData[formField as string] = row[csvCol];
        }
      }

      return mappedData;
    });

    // If preview mode, just return the mapped data
    if (importMode === 'preview') {
      return res.json({
        success: true,
        rowCount: mappedRows.length,
        sampleRows: mappedRows.slice(0, 5),
        mappedRows,
      });
    }

    // Import mode: create orders or form responses
    if (importMode === 'import') {
      const results = [];
      let successCount = 0;
      let failCount = 0;

      for (const mappedData of mappedRows) {
        try {
          // Insert form response (assumes order already exists or will be created)
          // For now, we just store the form response data
          const { data: response, error: insertError } = await supabase
            .from('form_responses')
            .insert([
              {
                schema_id: schemaId,
                sme_id: smeId,
                response_data: mappedData,
              },
            ])
            .select()
            .single();

          if (insertError) {
            failCount += 1;
            results.push({
              row: mappedData,
              success: false,
              error: insertError.message,
            });
          } else {
            successCount += 1;
            results.push({
              row: mappedData,
              success: true,
              responseId: response.id,
            });
          }
        } catch (rowError) {
          failCount += 1;
          results.push({
            row: mappedData,
            success: false,
            error: rowError instanceof Error ? rowError.message : 'Unknown error',
          });
        }
      }

      return res.json({
        success: true,
        message: `Imported ${successCount} rows, ${failCount} failed`,
        successCount,
        failCount,
        results: results.slice(0, 10), // Return first 10 result details
      });
    }

    return res.status(400).json({ success: false, error: 'Invalid importMode' });
  } catch (error) {
    console.error('[CSV Mapper] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/csv-mapper/auto-detect
 * Auto-detect column names and suggest field mappings
 */
router.post('/csv-mapper/auto-detect', async (req: Request, res: Response) => {
  try {
    const { csvData, schemaId } = req.body;
    const smeId = req.headers['x-sme-id'] as string;

    if (!smeId) {
      return res.status(401).json({ success: false, error: 'SME ID not provided' });
    }

    if (!csvData || !schemaId) {
      return res.status(400).json({ success: false, error: 'csvData and schemaId are required' });
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
      .from('form_fields')
      .select('field_key, label')
      .eq('schema_id', schemaId);

    if (fieldsError) {
      return res.status(500).json({ success: false, error: 'Failed to fetch form fields' });
    }

    // Simple auto-detection: match CSV headers to form field labels (case-insensitive)
    const suggestions: Record<string, string> = {};
    const fieldMap = new Map(fields?.map((f: any) => [f.label.toLowerCase(), f.field_key]) || []);

    for (const csvHeader of csvHeaders) {
      const normalized = csvHeader.toLowerCase();
      const matchedFieldKey = fieldMap.get(normalized);
      if (matchedFieldKey) {
        suggestions[csvHeader] = matchedFieldKey;
      }
    }

    return res.json({
      success: true,
      csvHeaders,
      formFields: fields || [],
      suggestions,
    });
  } catch (error) {
    console.error('[CSV Auto-Detect] Error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
