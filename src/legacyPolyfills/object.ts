if (!Object.fromEntries) {
  Object.defineProperty(Object, 'fromEntries', {
    value(entries: any) {
      if (!entries || !entries[Symbol.iterator]) {
        throw new Error('Object.fromEntries() requires a single iterable argument')
      }

      const o: any = {}

      Object.keys(entries).forEach(key => {
        const [k, v] = entries[key]

        o[k] = v
      })

      return o
    },
  })
}

if (!(Object as any).hasOwn) {
  ;(Object as any).hasOwn = function (obj: any, prop: any) {
    return Object.prototype.hasOwnProperty.call(obj, prop)
  }
}
