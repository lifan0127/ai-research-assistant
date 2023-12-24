export interface copyButtonDef {
  name: 'COPY'
  utils: {
    copy: (props: any) => void
  }
}

export interface noteButtonDef {
  name: 'NOTE'
  utils: {
    createNote: (props: any) => Promise<string>
  }
}

export interface annotationButtonDef {
  name: 'ANNOTATION'
  utils: {
    createAnnotation: (props: any) => string
  }
}
