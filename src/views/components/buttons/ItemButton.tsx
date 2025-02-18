import React, { useRef } from "react"
import { ItemIcon } from "../../icons/zotero"
import { ItemInfo, AttachmentInfo } from "../../../typings/zotero"
import { useDialog } from "../../../hooks/useDialog"

interface ItemButtonProps {
  item: Pick<ItemInfo, "id" | "type"> | Pick<AttachmentInfo, "id" | "type">
  mode: "item" | "attachment"
  text?: string
}

export function ItemButton({ item, mode, text }: ItemButtonProps) {
  const dialog = useDialog()
  const ref = useRef<HTMLAnchorElement>(null)

  function openItem(
    event: React.MouseEvent<HTMLAnchorElement>,
    item: ItemInfo | AttachmentInfo,
    ref: React.RefObject<HTMLAnchorElement>,
    dialog: ReturnType<typeof useDialog>,
    mode: "item" | "attachment",
  ) {
    event.preventDefault()
    // if (dialog.mode === "NORMAL") {
    //   dialog.minimize()
    //   setTimeout(() => {
    //     console.log({ ref })
    //     ref.current?.scrollIntoView()
    //   }, 50)
    // }
    switch (mode) {
      case "attachment":
        return Zotero.getActiveZoteroPane().viewAttachment(item.id)
      case "item":
        return Zotero.getActiveZoteroPane().selectItem(item.id)
    }
  }

  return (
    <a
      ref={ref}
      href="#"
      onClick={(event) => openItem(event, item, ref, dialog, mode)}
    >
      {text ? text : <ItemIcon type={item.type} />}
    </a>
  )
}
