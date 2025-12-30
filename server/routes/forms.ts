import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './server/.env' });

const router = Router();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables for server');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * POST /api/forms
 * Create a new form schema
 */
router.post('/forms', async (req: Request, res: Response) => {
  try {
    const { name, description, fields } = req.body;
    const smeId = req.headers['x-sme-id'] as string;

    if (!smeId) {
      return res.status(401).json({ success: false, error: 'SME ID not provided' });
    }

    if (!name) {
      return res.status(400).json({ success: false, error: 'Form name is required' });
    }

    // Insert form schema
    const { data: schema, error: schemaError } = await supabase
      .from('form_schemas')
      .insert([{ sme_id: smeId, name, description }])
      .select()
      .single();

    if (schemaError) {
      console.error('[Forms] Schema insert error:', schemaError);
      return res.status(500).json({ success: false, error: 'Failed to create form schema' });
    }

    // Insert fields if provided
    if (fields && Array.isArray(fields) && fields.length > 0) {
      const fieldsToInsert = fields.map((field: any, index: number) => ({
        schema_id: schema.id,
        field_key: field.field_key || `field_${index}`,
        label: field.label,
        type: field.type,
        required: field.required ?? true,
        options: field.options,
        validation: field.validation,
        placeholder: field.placeholder,
        help_text: field.help_text,
        field_order: index,
      }));

      const { error: fieldsError } = await supabase
        .from('form_fields')
        .insert(fieldsToInsert);

      if (fieldsError) {
        console.error('[Forms] Fields insert error:', fieldsError);
        return res.status(500).json({ success: false, error: 'Failed to create form fields' });
      }
    }

    return res.json({ success: true, schema });
  } catch (error) {
    console.error('[Forms POST Error]', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/forms/:id
 * Fetch a form schema with its fields
 */
router.get('/forms/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: schema, error: schemaError } = await supabase
      .from('form_schemas')
      .select('*')
      .eq('id', id)
      .single();

    if (schemaError) {
      return res.status(404).json({ success: false, error: 'Form schema not found' });
    }

    const { data: fields, error: fieldsError } = await supabase
      .from('form_fields')
      .select('*')
      .eq('schema_id', id)
      .order('field_order', { ascending: true });

    if (fieldsError) {
      console.error('[Forms] Fields fetch error:', fieldsError);
      return res.status(500).json({ success: false, error: 'Failed to fetch fields' });
    }

    return res.json({
      success: true,
      schema: { ...schema, fields: fields || [] },
    });
  } catch (error) {
    console.error('[Forms GET Error]', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/forms
 * Fetch all form schemas for the SME
 */
router.get('/forms', async (req: Request, res: Response) => {
  try {
    const smeId = req.headers['x-sme-id'] as string;

    if (!smeId) {
      return res.status(401).json({ success: false, error: 'SME ID not provided' });
    }

    const { data: schemas, error } = await supabase
      .from('form_schemas')
      .select('*')
      .eq('sme_id', smeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Forms] Fetch error:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch forms' });
    }

    return res.json({ success: true, schemas: schemas || [] });
  } catch (error) {
    console.error('[Forms GET List Error]', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PUT /api/forms/:id
 * Update a form schema and fields
 */
router.put('/forms/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, fields } = req.body;
    const smeId = req.headers['x-sme-id'] as string;

    if (!smeId) {
      return res.status(401).json({ success: false, error: 'SME ID not provided' });
    }

    // Verify ownership
    const { data: schema, error: fetchError } = await supabase
      .from('form_schemas')
      .select('sme_id')
      .eq('id', id)
      .single();

    if (fetchError || schema.sme_id !== smeId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    // Update schema
    const { error: updateError } = await supabase
      .from('form_schemas')
      .update({ name, description, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (updateError) {
      console.error('[Forms] Update error:', updateError);
      return res.status(500).json({ success: false, error: 'Failed to update form' });
    }

    // Delete and recreate fields if provided
    if (fields && Array.isArray(fields)) {
      await supabase.from('form_fields').delete().eq('schema_id', id);

      if (fields.length > 0) {
        const fieldsToInsert = fields.map((field: any, index: number) => ({
          schema_id: id,
          field_key: field.field_key || `field_${index}`,
          label: field.label,
          type: field.type,
          required: field.required ?? true,
          options: field.options,
          validation: field.validation,
          placeholder: field.placeholder,
          help_text: field.help_text,
          field_order: index,
        }));

        const { error: fieldsError } = await supabase
          .from('form_fields')
          .insert(fieldsToInsert);

        if (fieldsError) {
          console.error('[Forms] Fields update error:', fieldsError);
          return res.status(500).json({ success: false, error: 'Failed to update form fields' });
        }
      }
    }

    return res.json({ success: true, message: 'Form updated successfully' });
  } catch (error) {
    console.error('[Forms PUT Error]', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * DELETE /api/forms/:id
 * Soft-delete (deactivate) a form schema
 */
router.delete('/forms/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const smeId = req.headers['x-sme-id'] as string;

    if (!smeId) {
      return res.status(401).json({ success: false, error: 'SME ID not provided' });
    }

    // Verify ownership
    const { data: schema, error: fetchError } = await supabase
      .from('form_schemas')
      .select('sme_id')
      .eq('id', id)
      .single();

    if (fetchError || schema.sme_id !== smeId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    // Soft delete (deactivate)
    const { error: deleteError } = await supabase
      .from('form_schemas')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (deleteError) {
      console.error('[Forms] Delete error:', deleteError);
      return res.status(500).json({ success: false, error: 'Failed to delete form' });
    }

    return res.json({ success: true, message: 'Form deleted successfully' });
  } catch (error) {
    console.error('[Forms DELETE Error]', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/forms/:id/responses
 * Submit a form response (create order with custom data)
 */
router.post('/forms/:id/responses', async (req: Request, res: Response) => {
  try {
    const { id: schemaId } = req.params;
    const { orderId, responseData } = req.body;
    const smeId = req.headers['x-sme-id'] as string;

    if (!smeId) {
      return res.status(401).json({ success: false, error: 'SME ID not provided' });
    }

    if (!orderId || !responseData) {
      return res.status(400).json({ success: false, error: 'orderId and responseData are required' });
    }

    // Insert form response
    const { data: response, error: insertError } = await supabase
      .from('form_responses')
      .insert([
        {
          schema_id: schemaId,
          order_id: orderId,
          sme_id: smeId,
          response_data: responseData,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error('[Forms Response] Insert error:', insertError);
      return res.status(500).json({ success: false, error: 'Failed to save form response' });
    }

    return res.json({ success: true, response });
  } catch (error) {
    console.error('[Forms Response POST Error]', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/forms/:schemaId/responses/:orderId
 * Get form response for an order
 */
router.get('/forms/:schemaId/responses/:orderId', async (req: Request, res: Response) => {
  try {
    const { schemaId, orderId } = req.params;

    const { data: response, error } = await supabase
      .from('form_responses')
      .select('*')
      .eq('schema_id', schemaId)
      .eq('order_id', orderId)
      .single();

    if (error) {
      return res.status(404).json({ success: false, error: 'Form response not found' });
    }

    return res.json({ success: true, response });
  } catch (error) {
    console.error('[Forms Response GET Error]', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
