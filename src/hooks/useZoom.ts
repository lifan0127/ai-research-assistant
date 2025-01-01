import React, { useState, useMemo, useCallback } from "react"
import { getPref, setPref } from "../utils/prefs"

export function useZoom() {
  const [scale, setScale] = useState(
    (getPref("DEFAULT_ZOOM_LEVEL") as number) || 100,
  )

  const setScaleAndSave = useCallback(
    (scale: number) => {
      const constraintScale = Math.max(25, Math.min(400, scale))
      setPref("DEFAULT_ZOOM_LEVEL", constraintScale)
      setScale(constraintScale)
    },
    [scale],
  )

  const containerStyle = useMemo(() => {
    switch (scale) {
      case 1: {
        return {
          width: "calc(100% - 20px)",
        }
      }
      default: {
        const constraintScale = Math.max(25, Math.min(400, scale))
        const sizePct = Math.round(10000 / constraintScale)
        const posPct = Math.round(50 * (2 - 100 / constraintScale))
        return {
          // width: `${sizePct}%`,
          height: `${sizePct}%`,
          left: `${posPct}%`,
          top: `${posPct}%`,
          transform: `scale(${constraintScale / 100}) translate(-50%, -50%)`,
          width: `calc(${sizePct}% - 20px)`,
        }
      }
    }
  }, [scale])

  return {
    scale: scale,
    setScale: setScaleAndSave,
    style: containerStyle,
  }
}
