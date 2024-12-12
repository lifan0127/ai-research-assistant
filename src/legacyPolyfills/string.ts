if (!(String.prototype as any).replaceAll) {
  ;(String.prototype as any).replaceAll = function (search: any, replacement: any) {
    const target = this
    return target.split(search).join(replacement)
  }
}

if (!String.prototype.trimStart) {
  String.prototype.trimStart = function () {
    return this.replace(/^\s+/, '')
  }
}

if (!String.prototype.trimEnd) {
  String.prototype.trimEnd = function () {
    return this.replace(/\s+$/, '')
  }
}
