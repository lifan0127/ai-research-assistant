const { TextEncoder: ZoteroTextEncoder, TextDecoder: ZoteroTextDecoder } = Components.utils.import(
  'resource://gre/modules/Services.jsm',
  {}
)

export { ZoteroTextEncoder, ZoteroTextDecoder }
