import React from "react";
import { StateName } from "../../models/utils/states";
import "./style.css";

interface IconProps {
  enlarged?: boolean;
}

interface ZoteroIconProps extends IconProps {
  category: string;
  type?: string | undefined;
}

// All available icons: https://github.com/zotero/zotero/tree/f012a348af1143a7e033d697beae86df729080ab/chrome/skin/default/zotero
function ZoteroIcon({ category, type, enlarged = false }: ZoteroIconProps) {
  // tag.png is no longer available: https://github.com/zotero/zotero/blob/main/chrome/skin/default/zotero/tag.svg
  const url =
    category === "tag"
      ? "chrome://zotero/skin/tag.svg"
      : type
        ? `chrome://zotero/skin/${category}-${type}${enlarged ? "@2x" : ""}.png`
        : `chrome://zotero/skin/${category}${enlarged ? "@2x" : ""}.png`;
  return (
    <span className="mx-0.5">
      <img className="align-middle" src={url}></img>
    </span>
  );
}

interface ItemIconProps extends IconProps {
  type?: Zotero.Item.ItemType;
}

export function ItemIcon({ type }: ItemIconProps) {
  // return <ZoteroIcon category="treeitem" {...props} />
  return (
    <span
      className="icon icon-css icon-item-type cell-icon"
      data-item-type={type}
    ></span>
  );
}

export function CollectionIcon(props: IconProps) {
  // return <ZoteroIcon category="treesource" type="collection" {...props} />;
  return <span className="icon icon-css icon-collection cell-icon"></span>;
}

export function TagIcon(props: IconProps) {
  return <ZoteroIcon category="tag" {...props} />;
}

export function CreatorIcon(props: IconProps) {
  // return <ZoteroIcon category="treesource" type="groups" {...props} />;
  return <span className="icon icon-css icon-groups cell-icon"></span>;
}

interface LocateItemProps extends IconProps {
  type: "external-viewer" | "internal-viewer" | "show-file" | "view-online";
}

export function LocateIcon(props: LocateItemProps) {
  return <ZoteroIcon category="locate" {...props} />;
}

export function SelectionIcon({
  name,
  id,
  type,
}: {
  name: StateName;
  id?: number;
  type?: Zotero.Item.ItemType | "collection" | "creator" | "tag" | "image";
}) {
  switch (name) {
    case "items": {
      return <ItemIcon key={id} type={type as Zotero.Item.ItemType} />;
    }
    case "collections": {
      return <CollectionIcon />;
    }
    case "tags": {
      return <TagIcon />;
    }
    case "creators": {
      return <CreatorIcon />;
    }
    case "images":
    default: {
      return null;
    }
  }
}
