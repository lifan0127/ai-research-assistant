# A.R.I.A. (Aria) - Your AI Research Assistant

[![License](https://img.shields.io/github/license/lifan0127/ai-research-assistant)](https://github.com/lifan0127/ai-research-assistant/blob/master/LICENSE)
[![Using Zotero Plugin Template](https://img.shields.io/badge/Using-Zotero%20Plugin%20Template-blue?style=flat-square&logo=github)](https://github.com/windingwind/zotero-plugin-template)
[![Latest release](https://img.shields.io/github/v/release/lifan0127/ai-research-assistant)](https://github.com/lifan0127/ai-research-assistant/releases)
![Downloads latest release](https://img.shields.io/github/downloads/lifan0127/ai-research-assistant/latest/total)

> ## If you have previously installed Aria (formerly Zotero RA) version 0.0.10 or below, please manually remove it under Tools => Add-ons => Remove. Because the legacy versions have incompetible plugin ID and cannot be auto-updated.

Aria is a Zotero plugin powered by Large Language Models (LLMs). A-R-I-A is the acronym of "AI Research Assistant" in reverse order.

![Aria](assets/images/aria.png)

## Installation

- Download the latest release (.xpi file) from GitHub: https://github.com/lifan0127/ai-research-assistant/releases/latest
- In Zotero select <em>Tools</em> from the top menu bar, and then click on <em>Addons</em>.
- On the Add-ons Manager panel, click the gear icon at the top right corner and select <em>Install Add-on From File</em>
- Select the .xpi file you just downloaded and click <em>Open</em> which will start the installation process.

## Quickstart

Aria can be activated through the "Shift + R" shortcut.

Before using Aria, you need to provide an [OpenAI API Key](https://platform.openai.com/account/api-keys). Follow the in-app instruction to add a key and <b>restart Zotero</b>. ([screenshots](docs/configuration.md))

After restart, you should see the activated Aria window (as shown above) and can start using it through conversations.

## Update

- Aria can perform automatic update when internet access is available. To check for available update, select <em>Tools</em> from the top menu bar, and then click on <em>Addons</em>.
- To manually update ARIA, click <em>More</em> under Aria and then click the gear icon at the top right corner. Select <em>Check for Updates</em>. ([screenshots](docs/update.md))

## Limitations

The following are known limitations based on user feedback.

- Currently Aria can query your Zotero library through the Zotero search API. The ability to query the Zotero SQLite database for document count and other metrics will be delivered in a future release.
- Aria has no awareness of your Zotero application state (selected item, current tab, highlighted text) and therefore cannot answer the related questions. This capability will be added over time.

## Troubleshooting

  Interaction with Zotero, in an open conversational manner and through a probabilistic model, can lead to many different, often unexpected outcomes. If you experience any error, please create an GitHub issue with a screenshot of the error message from your Aria chat window. Thank you!

- "Agent stopped due to max iterations": For certain questions, the bot will make multiple API calls iteratively for response synthesis. Sometimes, it may fail to produce an answer before reaching the max iterations.

- Aria tab not in Preferences panel: You may choose the __Advanced__ tab in Preferences and open the __Configuration Editor__ Under Advanced Configuration. From there, please search for "aria" and then double-click on the "extensions.zotero.aria.OPENAI_API_KEY" entry to add your OpenAI API Key.
