import React from "react"
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  Row,
} from "@tanstack/react-table"
import { recursiveSearchAndCompileResults } from "../../../apis/zotero/search"
import { ItemButton } from "../buttons/ItemButton"
import type { transformPreviewResult } from "../../../apis/zotero/item"

const columnHelper =
  createColumnHelper<ReturnType<typeof transformPreviewResult>>()

const columns = [
  columnHelper.accessor("title", {
    header: "Title",
  }),
  columnHelper.accessor("creators", {
    header: "Creators",
  }),
  columnHelper.accessor("itemType", {
    header: "Item Type",
  }),
  columnHelper.accessor("year", {
    header: "Year",
    cell: ({ cell }) => cell.getValue() || "–",
  }),
  // Note: The following doesn't work as useRef becomes null in ItemButtons
  // columnHelper.accessor('links', {
  //   header: '',
  //   cell: props => {
  //     const { item, attachment } = props.getValue()
  //     const ref = useRef<HTMLButtonElement>(null)
  //     return (
  //       <div className="whitespace-nowrap">
  //         <button ref={ref} onClick={() => console.log({ ref })}>
  //           Test
  //         </button>
  //         <ItemButton item={item} mode="item" />
  //         {attachment ? <ItemButton item={attachment} mode="attachment" /> : null}
  //       </div>
  //     )
  //   },
  // }),
]

function createLinks(row: Row<ReturnType<typeof transformPreviewResult>>) {
  if (!row.original || !row.original.links) {
    return null
  }
  const { item, attachment } = row.original.links
  return (
    <div className="whitespace-nowrap">
      <ItemButton item={item} mode="item" />
      {attachment ? <ItemButton item={attachment} mode="attachment" /> : null}
    </div>
  )
}

type SearchResultTableProps = Awaited<
  ReturnType<typeof recursiveSearchAndCompileResults>
>

export function SearchResultTable({ count, results }: SearchResultTableProps) {
  const table = useReactTable({
    data: (results as any) || [],
    columns,
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <div>
      <table className="w-full border-collapse border-spacing-0">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="bg-slate-200">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="text-left py-1 whitespace-nowrap"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </th>
              ))}
              <th></th>
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row, i) => (
            <tr key={row.id} className={i % 2 === 1 ? "bg-slate-100" : ""}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="py-1">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
              <td>{createLinks(row)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          {table.getFooterGroups().map((footerGroup) => (
            <tr key={footerGroup.id} className="py-1">
              {footerGroup.headers.map((header) => (
                <th key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.footer,
                        header.getContext(),
                      )}
                </th>
              ))}
            </tr>
          ))}
        </tfoot>
      </table>
    </div>
  )
}
