import React, { useState, useEffect } from "react"

interface LocalAIModelSelectionProps {
  settings: {
    LocalAIBasePath?: string
    LocalAIApiKey?: string
    LocalAISelectedModel?: string
  }
  onUpdateSettings: (updatedSettings: Partial<LocalAIModelSelectionProps["settings"]>) => void
}

const LocalAIModelSelection: React.FC<LocalAIModelSelectionProps> = ({ settings, onUpdateSettings }) => {
  const [customModels, setCustomModels] = useState<Array<{ id: string }>>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [basePath, setBasePath] = useState<string>(settings?.LocalAIBasePath || "")
  const [apiKey, setApiKey] = useState<string>(settings?.LocalAIApiKey || "")

  useEffect(() => {
    async function fetchModels() {
      if (!basePath || !basePath.includes("/v1")) {
        setCustomModels([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = await fetch(`${basePath}/v1/models`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: apiKey ? `Bearer ${apiKey}` : undefined,
          },
        })
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }
        const data = await response.json()
        setCustomModels(data.models || [])
      } catch (error) {
        console.error("Failed to fetch models from LocalAI:", error)
        setCustomModels([])
      } finally {
        setLoading(false)
      }
    }

    fetchModels()
  }, [basePath, apiKey])

  return (
    <div className="flex flex-col w-full">
      {/* Base Path Input */}
      <label className="text-sm font-semibold mb-2">LocalAI Base URL</label>
      <input
        type="text"
        value={basePath}
        onChange={(e) => {
          const value = e.target.value
          setBasePath(value)
          onUpdateSettings({ LocalAIBasePath: value })
        }}
        placeholder="e.g., http://localhost:8080/v1"
        className="border border-gray-300 rounded-lg p-2 mb-4 w-full"
      />

      {/* API Key Input */}
      <label className="text-sm font-semibold mb-2">LocalAI API Key (Optional)</label>
      <input
        type="text"
        value={apiKey}
        onChange={(e) => {
          const value = e.target.value
          setApiKey(value)
          onUpdateSettings({ LocalAIApiKey: value })
        }}
        placeholder="Enter API Key if required"
        className="border border-gray-300 rounded-lg p-2 mb-4 w-full"
      />

      {/* Models Dropdown */}
      <label className="text-sm font-semibold mb-2">Select Model</label>
      {loading ? (
        <div className="text-gray-500 text-sm">Loading models...</div>
      ) : customModels.length === 0 ? (
        <div className="text-gray-500 text-sm">No models found.</div>
      ) : (
        <select
          value={settings?.LocalAISelectedModel || ""}
          onChange={(e) =>
            onUpdateSettings({ LocalAISelectedModel: e.target.value })
          }
          className="border border-gray-300 rounded-lg p-2 w-full"
        >
          <option value="" disabled>
            -- Select a model --
          </option>
          {customModels.map((model) => (
            <option key={model.id} value={model.id}>
              {model.id}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}

export default LocalAIModelSelection
