export function setTimeout(callback: Function, delay: number) {
  let timer = Components.classes['@mozilla.org/timer;1'].createInstance(Components.interfaces.nsITimer)
  timer.initWithCallback(callback, delay, Components.interfaces.nsITimer.TYPE_ONE_SHOT)
  return timer
}

export function clearTimeout(timer: any) {
  if (timer) {
    timer.cancel()
  }
}
