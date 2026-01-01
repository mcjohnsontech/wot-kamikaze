import React, { useState, useRef } from "react";
import { Container, Card, Title, Text, Group, Stack, Button, Select, Loader, Center, Alert } from "@mantine/core";
import { IconUpload, IconChevronDown, IconAlertCircle, IconCheck } from "@tabler/icons-react";
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
  isLoading = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvContent, setCsvContent] = useState<string>("");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>(
    {}
  );
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [step, setStep] = useState<
    "upload" | "mapping" | "preview" | "importing"
  >("upload");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:3001/api";
  const { user } = useAuth();
  const smeId = user?.id || "";
  // const smeId = localStorage.getItem('sme_id') || ''; // Assumes SME ID stored in localStorage

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!smeId) {
      setError("You must be logged in as an SME to import data.");
      return;
    }
    

    setError(null);

    Papa.parse(file, {
      header: true, // Uses first row as keys
      skipEmptyLines: true, // Ignores blank rows at end of file
      complete: async (results) => {
        if (results.data.length === 0) {
          setError("The CSV file appears to be empty.");
          return;
        }

        // Store headers found in the CSV
        setCsvHeaders(results.meta.fields || []);

        // We still need the raw text to send to your backend
        // (Assuming backend uses a CSV parser too)
        const rawCsvText = Papa.unparse(results.data);
        setCsvContent(rawCsvText);

        // Auto-detect column mappings
        try {
          const response = await fetch(
            `${API_BASE_URL}/csv-mapper/auto-detect`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-sme-id": smeId,
              },
              body: JSON.stringify({ csvData: rawCsvText, schemaId }),
            }
          );

          const json = await response.json();
          if (json.success && json.suggestions) {
            setColumnMapping(json.suggestions);
          }
        } catch (err) {
          console.warn("Auto-detect failed, manual mapping required");
        }

        setStep("mapping");
      },
      error: (err) => {
        setError(`Error parsing CSV: ${err.message}`);
      },
    });
    // ---------------------------------
  };

  const handleMappingChange = (csvHeader: string, formFieldKey: string) => {
    setColumnMapping((prev) => ({
      ...prev,
      [csvHeader]: formFieldKey || "",
    }));
  };

  const handlePreview = async () => {
    setError(null);
    setStep("preview");

    try {
      const response = await fetch(`${API_BASE_URL}/csv-mapper`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-sme-id": smeId,
        },
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
        headers: {
          "Content-Type": "application/json",
          "x-sme-id": smeId,
        },
        body: JSON.stringify({
          csvData: csvContent,
          schemaId,
          columnMapping,
          importMode: "import",
        }),
      });

      const json = await response.json();
      if (json.success) {
        setSuccessMessage(
          `✅ Successfully imported ${json.successCount} rows!`
        );
        if (onImportComplete) {
          onImportComplete(json.successCount);
        }

        // Reset
        setTimeout(() => {
          setCsvContent("");
          setCsvHeaders([]);
          setColumnMapping({});
          setPreviewData([]);
          setStep("upload");
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }, 2000);
      } else {
        setError(json.error || "Import failed");
        setStep("preview");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
      setStep("preview");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">📊 CSV Importer</h1>
        <p className="text-purple-100">
          Bulk import order data from spreadsheets
        </p>
      </div>

      {/* Step 1: Upload */}
      {step === "upload" && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl font-bold transition-all text-lg"
          >
            <IconUpload size={32} color="var(--mantine-color-blue-4)" />
            Select CSV File
          </button>
          <p className="text-slate-400 mt-4 text-sm">
            First row should contain column headers. Supported: .csv files
          </p>
        </div>
      )}

      {/* Step 2: Column Mapping */}
      {step === "mapping" && csvHeaders.length > 0 && (
        <div className="space-y-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              📋 Map CSV Columns to Form Fields
            </h2>

            <div className="space-y-3 mb-6">
              {csvHeaders.map((header) => (
                <div key={header} className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-300">
                      {header}
                    </p>
                    <p className="text-xs text-slate-500">CSV Column</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                  <select
                    value={columnMapping[header] || ""}
                    onChange={(e) =>
                      handleMappingChange(header, e.target.value)
                    }
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 text-white text-sm rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                    <option value="">-- Skip Column --</option>
                    {formFields.map((field) => (
                      <option key={field.field_key} value={field.field_key}>
                        {field.label} ({field.type})
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <button
              onClick={handlePreview}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-bold transition-all"
            >
              Preview Data
            </button>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-600 rounded-lg p-4 text-red-300">
              ⚠️ {error}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Preview */}
      {step === "preview" && previewData.length > 0 && (
        <div className="space-y-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              👁️ Preview Data ({previewData.length} rows)
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-600">
                  <tr>
                    {Object.keys(previewData[0] || {}).map((key) => (
                      <th
                        key={key}
                        className="text-left px-3 py-2 text-slate-300 font-semibold"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {previewData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-700/50">
                      {Object.values(row as any).map((val, colIdx) => (
                        <td key={colIdx} className="px-3 py-2 text-slate-300">
                          {String(val).substring(0, 50)}
                          {String(val).length > 50 ? "..." : ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setStep("mapping")}
                className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold transition-all"
              >
                ← Back
              </button>
              <button
                onClick={handleImport}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white rounded-lg font-bold transition-all"
              >
                ✅ Import Now
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-600 rounded-lg p-4 text-red-300">
              ⚠️ {error}
            </div>
          )}
        </div>
      )}

      {/* Step 4: Importing */}
      {step === "importing" && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center">
          <Loader className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-white font-semibold">Importing data...</p>
          <p className="text-slate-400 text-sm mt-2">This may take a moment.</p>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="bg-emerald-900/30 border border-emerald-600 rounded-lg p-4 text-emerald-300">
          {successMessage}
        </div>
      )}
    </div>
  );
};

export default CSVMapper;
