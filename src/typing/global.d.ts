declare global {
  const __env__: "production" | "development"
  const _globalThis: {
    [key: string]: any
    Zotero: _ZoteroTypes.Zotero
    // ZoteroPane: _ZoteroTypes.ZoteroPane;
    // window: Window;
    // document: Document;
    ztoolkit: ZToolkit
    addon: typeof addon
  }
  type ZToolkit = import("../addon").CustomToolkit
  const ztoolkit: ZToolkit
  const rootURI: string
  const addon: import("../addon").default
}


import type { nsXPCComponents_Classes as _nsXPCComponents_Classes } from 'zotero-types/types/gecko/lib.gecko.tweaks'

export type nsXPCComponents_Classes = _nsXPCComponents_Classes