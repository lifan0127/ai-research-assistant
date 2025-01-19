import React, { useState, useEffect, useMemo } from "react"
import { Query } from "../../../typings/actions"
import { FileForIndexing } from "../../../typings/files"
import { recursiveSearch } from "../../../apis/zotero/search"
import { getItemsAndIndexAttachments } from "../../../apis/zotero/item"
import { useAssistant } from "../../../hooks/useAssistant"
import { uniq } from "lodash"
import { ItemIcon } from "../../icons/zotero"

interface FileRetrievalProps {
  itemIds?: number[]
  query?: Query
  onComplete: (results: FileForIndexing[]) => void
  files?: FileForIndexing[]
  limit?: number
}

export function FileRetriever({
  itemIds = [],
  query,
  onComplete,
  files,
  limit = 10,
}: FileRetrievalProps) {
  const { assistant } = useAssistant()
  const [count, setCount] = useState()
  const [results, setResults] = useState<FileForIndexing[] | undefined>(files)

  useEffect(() => {
    async function retrieve(query: Query | undefined) {
      const searchItemIds = query ? await recursiveSearch(query) : []
      const combinedItemIds = uniq([...itemIds, ...searchItemIds])
      const retrievedFiles = (
        await getItemsAndIndexAttachments(
          combinedItemIds,
          assistant.currentVectorStore!,
        )
      ).slice(0, limit)
      setResults(retrievedFiles)
      onComplete(retrievedFiles)
    }
    if (!files && (query || itemIds.length)) {
      retrieve(query as Query)
    }
  }, [query, itemIds, files, onComplete, assistant])

  if (!results) {
    return null
  }

  return (
    <table className="w-full table-auto border-collapse">
      <tbody>
        {results.map(({ item, attachment }, i) => (
          <tr
            key={item.id}
            className="border-b last:border-b-0 border-gray-100"
          >
            <td className="py-2 pr-2">
              {/* <ItemIcon type={attachment!.itemType} /> */}
              {attachment!.attachmentFilename}
            </td>
            {/* <td className="py-2 pl-2">{JSON.stringify(attachment)}</td> */}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
