# Zotero RA - Your AI Research Assistant

[![License](https://img.shields.io/github/license/lifan0127/zotero-research-assistant)](https://github.com/lifan0127/zotero-research-assistant/blob/master/LICENSE)
[![Using Zotero Plugin Template](https://img.shields.io/badge/Using-Zotero%20Plugin%20Template-blue?style=flat-square&logo=github)](https://github.com/windingwind/zotero-plugin-template)
[![Latest release](https://img.shields.io/github/v/release/lifan0127/zotero-research-assistant)](https://github.com/lifan0127/zotero-research-assistant/releases)
![Downloads latest release](https://img.shields.io/github/downloads/lifan0127/zotero-research-assistant/latest/total)

Your AI research assistant in Zotero, powered by Large Language Models (LLMs).

![Zotero RA](assets/images/zotero-ra.png)

## Installation

- Download the latest release (.xpi file) from GitHub: https://github.com/lifan0127/zotero-research-assistant/releases/latest
- In Zotero select <em>Tools</em> from the top menu bar, and then click on <em>Addons</em>.
- On the Add-ons Manager panel, click the gear icon at the top right corner and select <em>Install Add-on From File</em>
- Select the .xpi file you just downloaded and click <em>Open</em> which will start the installation process.

## Quickstart

Zotero RA can be activated through the "Shift + R" shortcut.

Before using Zotero RA, you need to provide an [OpenAI API Key](https://platform.openai.com/account/api-keys). Follow the in-app instruction to add a key and <b>restart Zotero</b>. ([screenshots](docs/configuration.md))

After restart, you should see the activated Zotero RA window (as shown above) and can start using it through conversations.

## Update

- Zotera RA can perform automatic update when internet access is available. To check for available update, select <em>Tools</em> from the top menu bar, and then click on <em>Addons</em>.
- To manually update Zotera RA, click <em>More</em> under Zotera RA and then click the gear icon at the top right corner. Select <em>Check for Updates</em>. ([screenshots](docs/update.md))

## Limitations

The following are known limitations based on user feedback.

- Currently Zotero RA can query your Zotero library through the Zotero search API. The ability to query the Zotero SQLite database for document count and other metrics will be delivered in a future release.
- Zotero RA has no awareness of your Zotero application state (selected item, current tab, highlighted text) and therefore cannot answer the related questions. This capability will be added over time.

## Troubleshooting

  Interaction with Zotero, in an open conversational manner and through a probabilistic model, can lead to many different, often unexpected outcomes. If you experience any error, please create an GitHub issue with a screenshot of the error message from your Zotero RA chat window. Thank you!

- "Unable to parse JSON response from chat agent": This is perhaps the most common error which is caused by GPT not following its output format instructions. This should be fixed once the parse exception handling logic is introduced into LangChain: https://github.com/hwchase17/langchain/pull/2656.

- "Agent stopped due to max iterations": For certain questions, the bot will make multiple API calls iteratively for response synthesis. Sometimes, it may fail to produce an answer before reaching the max iterations.

- ZoteroRA tab not in Preferences panel: You may choose the __Advanced__ tab in Preferences and open the __Configuration Editor__ Under Advanced Configuration. From there, please search for "zoterora" and then double-click on the "extensions.zotero.zoteroRa.OPENAI_API_KEY" entry to add your OpenAI API Key.
