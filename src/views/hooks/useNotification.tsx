import React from "react"

export function useNotification() {
  const notification = null
  // const notification = (
  //   <>
  //     This is the final version compatible with Zotero 6. Future releases will
  //     support only Zotero 7.{" "}
  //     <a
  //       href="#"
  //       onClick={() => {
  //         Zotero.launchURL(
  //           `https://github.com/lifan0127/ai-research-assistant/releases`,
  //         )
  //       }}
  //       className="border-none bg-transparent m-0 p-0 text-black underline"
  //     >
  //       Please find the latest release here.
  //     </a>
  //   </>
  // )

  return {
    notification: notification ? (
      <div
        className={
          "w-full bg-red-400 text-black px-4 py-2 -mx-3 text-center z-10"
        }
      >
        {notification}
      </div>
    ) : null,
    hasNotification: !!notification,
  }
}
