if (!Error.captureStackTrace) {
  Error.captureStackTrace = function (targetObject: any, constructorOpt: any) {
    const error = new Error()
    if (Error.prepareStackTrace) {
      targetObject.stack = Error.prepareStackTrace(targetObject, error.stack as any)
    } else {
      targetObject.stack = error.stack
    }
  }
}
