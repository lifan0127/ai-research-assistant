import { config, homepage } from "../../package.json"
import { getString } from "../utils/locale"
import React from "react"
import ReactDOM from "react-dom"
import LocalAIModelSelection from "../LocalAIModelSelection"

interface AddonPreferences {
  window: Window | null
  llmProvider: "openai" | "localai"
  localAISettings: {
    LocalAIBasePath?: string
    LocalAIApiKey?: string
    LocalAISelectedModel?: string
  }
}

// Declare global addon object
declare const addon: {
  data: {
    prefs: AddonPreferences
  }
}

// Register the preferences pane with Zotero
export function registerPrefs(): void {
  Zotero.PreferencePanes.register({
    pluginID: config.addonID,
    src: rootURI + "chrome/content/preferences.xhtml",
    label: getString("prefs-title"),
    image: `chrome://${config.addonRef}/content/icons/favicon@0.333x.png`,
    helpURL: homepage,
  })
}

// Initialize the preferences pane when opened
export function registerPrefsScripts(_window: Window): void {
  if (!addon.data.prefs) {
    addon.data.prefs = {
      window: _window,
      llmProvider: "openai", // Default to OpenAI
      localAISettings: {
        LocalAIBasePath: "",
        LocalAIApiKey: "",
        LocalAISelectedModel: "",
      },
    }
  } else {
    addon.data.prefs.window = _window
  }

  updatePrefsUI()
  bindPrefEvents()
}

// Render the preferences pane UI
async function updatePrefsUI(): Promise<void> {
  const prefsWindow = addon.data.prefs.window
  if (!prefsWindow) {
    console.error("Preferences window is not available.")
    return
  }

  // Get the container element for the preferences pane
  const container = prefsWindow.document.querySelector(
    `#zotero-prefpane-${config.addonRef}-container`
  )
  if (!container) {
    console.error("Preferences container not found!")
    return
  }

  // Render the React UI
  ReactDOM.render(
    <div className="flex flex-col gap-4">
      {/* LLM Provider Selection */}
      <h3>{getString("prefs-llm-provider-title")}</h3>
      <label htmlFor="llm-provider">{getString("prefs-llm-provider-label")}</label>
      <select
        id="llm-provider"
        value={addon.data.prefs.llmProvider}
        onChange={(e) => {
          const selectedProvider = e.target.value as "openai" | "localai"
          addon.data.prefs.llmProvider = selectedProvider
          updateLocalAIVisibility(selectedProvider === "localai")
        }}
        className="border border-gray-300 rounded-lg p-2"
      >
        <option value="openai">{getString("prefs-llm-provider-openai")}</option>
        <option value="localai">{getString("prefs-llm-provider-localai")}</option>
      </select>

      {/* LocalAI Settings */}
      <div
        id="localai-settings"
        style={{ display: addon.data.prefs.llmProvider === "localai" ? "block" : "none" }}
      >
        <LocalAIModelSelection
          settings={addon.data.prefs.localAISettings}
          onUpdateSettings={(updatedSettings) => {
            addon.data.prefs.localAISettings = {
              ...addon.data.prefs.localAISettings,
              ...updatedSettings,
            }
          }}
        />
      </div>
    </div>,
    container
  )
}

// Toggle the visibility of the LocalAI-specific settings
function updateLocalAIVisibility(isLocalAI: boolean): void {
  const prefsWindow = addon.data.prefs.window
  if (!prefsWindow) {
    console.error("Preferences window is not available.")
    return
  }

  const localAISettingsDiv = prefsWindow.document.querySelector("#localai-settings")
  if (localAISettingsDiv) {
    localAISettingsDiv.style.display = isLocalAI ? "block" : "none"
  }
}

// Bind events for non-React elements
function bindPrefEvents(): void {
  const prefsWindow = addon.data.prefs.window
  if (!prefsWindow) {
    console.error("Preferences window is not available.")
    return
  }

  // Example event binding for OpenAI settings
  prefsWindow.document
    .querySelector(`#zotero-prefpane-${config.addonRef}-OPENAI_API_KEY`)
    ?.addEventListener("change", (e: Event) => {
      const target = e.target as HTMLInputElement
      addon.data.prefs.window?.alert(
        `Please restart Zotero for your new OpenAI API Key (${target.value}) to take effect.`
      )
    })

  // Example event binding for LocalAI settings
  prefsWindow.document
    .querySelector(`#zotero-prefpane-${config.addonRef}-LocalAI_BASE_URL`)
    ?.addEventListener("change", (e: Event) => {
      const target = e.target as HTMLInputElement
      addon.data.prefs.window?.alert(
        `Please restart Zotero for your new LocalAI Base URL (${target.value}) to take effect.`
      )
    })
}
