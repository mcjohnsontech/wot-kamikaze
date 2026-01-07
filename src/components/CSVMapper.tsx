import React, { useState, useRef } from "react";
import {
  Title, Text, Group, Stack, Button, Select, Loader, Center,
  Alert, Paper, Table, ScrollArea, ActionIcon,
  Timeline, Tooltip, Badge, ThemeIcon
} from "@mantine/core";
import {
  IconUpload, IconCheck, IconX, IconFileTypeCsv,
  IconArrowRight, IconTable, IconDatabaseImport
} from "@tabler/icons-react";
import Papa from "papaparse";
import { useAuth } from "../context/AuthContext";

interface FormField {
  id?: string;
  field_key: string;
  label: string;
  type: string;
}

interface CSVMapperProps {
  schemaId: string;
  formFields: FormField[];
  onImportComplete?: (rowCount: number) => void;
  isLoading?: boolean;
}

const CSVMapper: React.FC<CSVMapperProps> = ({
  schemaId,
  formFields,
  onImportComplete,
  isLoading: parentLoading = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvContent, setCsvContent] = useState<string>("");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [step, setStep] = useState<"upload" | "mapping" | "preview" | "importing">("upload");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
  const { user } = useAuth();
  const smeId = user?.id || "";

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!smeId) {
      setError("You must be logged in as an SME to import data.");
      return;
    }

    setError(null);
    setSuccessMessage(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        if (results.data.length === 0) {
          setError("The CSV file appears to be empty.");
          return;
        }

        const headers = results.meta.fields || [];
        setCsvHeaders(headers);
        const rawCsvText = Papa.unparse(results.data);
        setCsvContent(rawCsvText);

        // Auto-detect mappings
        const newMapping: Record<string, string> = {};
        const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

        headers.forEach(header => {
          const h = normalize(header);
          if (['name', 'customername', 'fullname', 'receiver'].includes(h)) newMapping[header] = 'customer_name';
          if (['phone', 'phonenumber', 'mobile', 'contact', 'cell'].includes(h)) newMapping[header] = 'customer_phone';
          if (['address', 'deliveryaddress', 'location', 'destination'].includes(h)) newMapping[header] = 'delivery_address';
          if (['amount', 'price', 'total', 'cost', 'value'].includes(h)) newMapping[header] = 'price_total';

          // Custom field heuristics
          formFields.forEach(ff => {
            if (h.includes(normalize(ff.label)) && !newMapping[header]) {
              newMapping[header] = ff.field_key;
            }
          });
        });

        setColumnMapping(newMapping);
        setStep("mapping");
      },
      error: (err) => {
        setError(`Error parsing CSV: ${err.message}`);
      },
    });
  };

  const handlePreview = async () => {
    setError(null);

    // Validation: Ensure required system fields are mapped?
    // Not strictly forcing it here, but good to check.

    setStep("preview");

    try {
      const response = await fetch(`${API_BASE_URL}/csv-mapper`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-sme-id": smeId },
        body: JSON.stringify({
          csvData: csvContent,
          schemaId,
          columnMapping,
          importMode: "preview",
        }),
      });

      const json = await response.json();
      if (json.success) {
        setPreviewData(json.sampleRows || []);
      } else {
        setError(json.error || "Preview failed");
        setStep("mapping");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview failed");
      setStep("mapping");
    }
  };

  const handleImport = async () => {
    setError(null);
    setSuccessMessage(null);
    setStep("importing");

    try {
      const response = await fetch(`${API_BASE_URL}/csv-mapper`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-sme-id": smeId },
        body: JSON.stringify({
          csvData: csvContent,
          schemaId,
          columnMapping,
          importMode: "import",
        }),
      });

      const json = await response.json();
      if (json.success) {
        setSuccessMessage(`Successfully imported ${json.successCount} rows!`);
        if (onImportComplete) onImportComplete(json.successCount);

        // Reset after delay
        setTimeout(() => {
          setCsvContent("");
          setCsvHeaders([]);
          setColumnMapping({});
          setPreviewData([]);
          setStep("upload");
          if (fileInputRef.current) fileInputRef.current.value = "";
          setSuccessMessage(null);
        }, 3000);
      } else {
        setError(json.error || "Import failed");
        setStep("preview");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
      setStep("preview");
    }
  };

  const systemFields = formFields.filter(f => ['customer_name', 'customer_phone', 'delivery_address', 'price_total'].includes(f.field_key));
  const customFields = formFields.filter(f => !['customer_name', 'customer_phone', 'delivery_address', 'price_total'].includes(f.field_key));

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="center">
        <div>
          <Title order={2}>Upload CSV</Title>
          <Text c="dimmed">Map your file columns to our system to bulk create orders.</Text>
        </div>
        <StepIndicator step={step} />
      </Group>

      {error && (
        <Alert color="red" icon={<IconX size={16} />} title="Error" withCloseButton onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert color="teal" icon={<IconCheck size={16} />} title="Success">
          {successMessage}
        </Alert>
      )}

      {/* STEP 1: UPLOAD */}
      {step === "upload" && (
        <Paper
          withBorder
          p={50}
          radius="md"
          style={{
            borderStyle: 'dashed',
            backgroundColor: 'var(--mantine-color-gray-0)',
            cursor: 'pointer'
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <Stack align="center" gap="sm">
            <ThemeIcon size={60} radius="xl" variant="light" color="blue">
              <IconUpload size={30} />
            </ThemeIcon>
            <Title order={4}>Click to Upload CSV</Title>
            <Text c="dimmed" size="sm">Supported file type: .csv</Text>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </Stack>
        </Paper>
      )}

      {/* STEP 2: MAPPING */}
      {step === "mapping" && (
        <Stack>
          <Alert color="blue" icon={<IconDatabaseImport size={16} />}>
            We found <b>{csvHeaders.length}</b> columns in your file. Please map them to the correct fields below.
          </Alert>

          <Table withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Your CSV Column</Table.Th>
                <Table.Th>Maps To System Field</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {csvHeaders.map(header => (
                <Table.Tr key={header}>
                  <Table.Td fw={500}>{header}</Table.Td>
                  <Table.Td>
                    <Select
                      data={[
                        { group: 'System Fields (Required)', items: systemFields.map(f => ({ value: f.field_key, label: f.label })) },
                        { group: 'Custom Fields (Optional)', items: customFields.map(f => ({ value: f.field_key, label: f.label })) }
                      ]}
                      value={columnMapping[header] || null}
                      onChange={(val) => setColumnMapping(prev => ({ ...prev, [header]: val || '' }))}
                      placeholder="Skip this column"
                      searchable
                      clearable
                    />
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => { setStep("upload"); setCsvContent(""); }}>Cancel</Button>
            <Button onClick={handlePreview} rightSection={<IconArrowRight size={16} />}>Preview Data</Button>
          </Group>
        </Stack>
      )}

      {/* STEP 3: PREVIEW */}
      {step === "preview" && (
        <Stack>
          <Group justify="space-between">
            <Title order={4}>Preview Import Data</Title>
            <Badge size="lg" variant="light">{previewData.length} Rows Ready</Badge>
          </Group>

          <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
            <ScrollArea>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    {Object.keys(previewData[0] || {}).map((key) => (
                      <Table.Th key={key} style={{ whiteSpace: 'nowrap' }}>{key}</Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {previewData.slice(0, 10).map((row, i) => (
                    <Table.Tr key={i}>
                      {Object.values(row).map((val: any, j) => (
                        <Table.Td key={j} style={{ maxWidth: 300 }}>
                          {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                        </Table.Td>
                      ))}
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
            {previewData.length > 10 && (
              <Text ta="center" size="xs" c="dimmed" p="xs">Showing first 10 rows only</Text>
            )}
          </Paper>

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setStep("mapping")}>Back to Mapping</Button>
            <Button size="md" color="green" onClick={handleImport} rightSection={<IconCheck size={16} />}>
              Complete Import
            </Button>
          </Group>
        </Stack>
      )}

      {/* STEP 4: LOADING */}
      {step === "importing" && (
        <Center p={50}>
          <Stack align="center">
            <Loader size="lg" type="dots" />
            <Text>Importing your orders, please wait...</Text>
          </Stack>
        </Center>
      )}
    </Stack>
  );
};

const StepIndicator = ({ step }: { step: string }) => {
  const steps = ['upload', 'mapping', 'preview', 'importing'];
  const currentIdx = steps.indexOf(step);

  return (
    <Group gap="xs">
      <Badge variant={currentIdx >= 0 ? "filled" : "light"} color={currentIdx >= 0 ? "blue" : "gray"}>1. Upload</Badge>
      <IconArrowRight size={12} color="gray" />
      <Badge variant={currentIdx >= 1 ? "filled" : "light"} color={currentIdx >= 1 ? "blue" : "gray"}>2. Map</Badge>
      <IconArrowRight size={12} color="gray" />
      <Badge variant={currentIdx >= 2 ? "filled" : "light"} color={currentIdx >= 2 ? "blue" : "gray"}>3. Preview</Badge>
    </Group>
  )
}

export default CSVMapper;
