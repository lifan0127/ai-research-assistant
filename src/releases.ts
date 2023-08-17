const releases = [
  {
    date: '2021-08-17',
    version: '0.2.2',
    features: [
      'Aria is now displayed in a separate dialog window, facilitating positioning and resizing.',
      'Support for copying and pasting chat messages, in both markdown and rich text (HTML) formats.',
      'Users now have the ability to edit and delete chat messages.',
      'Initial support to drive Zotero through Aria, such as locating items and open PDF attachments.',
    ],
    bugFixes: ['Various bug fixes and performance improvements.'],
  },
  {
    date: '2021-07-23',
    version: '0.1.2',
    features: [
      'Switch to OpenAI GPT-4 model. This new model is capable of more complicated tasks compared to the previous GPT-3.5-Turbo model.',
      'Use OpenAI function calling for structured output. This new feature provides finer control for complex structured output by the bot.',
      'Completely re-writen user interface components using the React framework for better modularity and interactivity.',
      'Customized, interactive display widgets tailored for search results, Q&A and more.',
    ],
    bugFixes: ['Various bug fixes and performance improvements.'],
  },
]

export default releases
