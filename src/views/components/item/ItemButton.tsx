import React, { useRef } from 'react'
import { ItemIcon } from '../../icons/zotero'
import { ItemInfo, AttachmentInfo } from '../../../apis/zotero/item'
import { useDialog } from '../../hooks/useDialog'

interface ItemButtonProps {
  item: ItemInfo | AttachmentInfo
  mode: 'item' | 'attachment'
}

export function ItemButton({ item, mode }: ItemButtonProps) {
  const dialog = useDialog()
  const ref = useRef<HTMLAnchorElement>(null)

  function openItem(
    event: React.MouseEvent<HTMLAnchorElement>,
    item: ItemInfo | AttachmentInfo,
    ref: React.RefObject<HTMLAnchorElement>,
    dialog: ReturnType<typeof useDialog>,
    mode: 'item' | 'attachment'
  ) {
    event.preventDefault()
    if (dialog.mode === 'NORMAL') {
      dialog.minimize()
      setTimeout(() => {
        console.log({ ref })
        ref.current?.scrollIntoView()
      }, 50)
    }
    switch (mode) {
      case 'attachment':
        return ZoteroPane.viewAttachment(item.id)
      case 'item':
        return ZoteroPane.selectItem(item.id)
    }
  }

  return (
    <a ref={ref} href="#" onClick={event => openItem(event, item, ref, dialog, mode)}>
      <ItemIcon type={item.type} />
    </a>
  )
}
