if (!Array.prototype.flatMap) {
  Array.prototype.flatMap = function (callback, thisArg) {
    return this.reduce(function (acc, item, index, array) {
      return acc.concat(callback.call(thisArg as any, item, index, array))
    }, [])
  }
}
