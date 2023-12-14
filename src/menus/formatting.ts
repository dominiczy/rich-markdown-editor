import {
  BoldIcon,
  CodeIcon,
  ItalicIcon,
  BlockQuoteIcon,
  LinkIcon,
  StrikethroughIcon,
  InputIcon,
  HighlightIcon,
  AlignLeftIcon,
  AlignRightIcon,
  AlignCenterIcon,
} from "outline-icons";
import { isInTable } from "prosemirror-tables";
import { EditorState } from "prosemirror-state";
import isInList from "../queries/isInList";
import isMarkActive from "../queries/isMarkActive";
import isNodeActive from "../queries/isNodeActive";
import { MenuItem } from "../types";
import baseDictionary from "../dictionary";

export default function formattingMenuItems(
  state: EditorState,
  isTemplate: boolean,
  dictionary: typeof baseDictionary
): MenuItem[] {
  const { schema } = state;
  const isTable = isInTable(state);
  const isList = isInList(state);
  const allowBlocks = !isTable && !isList;

  const isLeftAligned = isNodeActive(schema.nodes.paragraph, {
    layoutClass: "left",
  });
  const isRightAligned = isNodeActive(schema.nodes.paragraph, {
    layoutClass: "right",
  });
  const isCenterAligned = isNodeActive(schema.nodes.paragraph, {
    layoutClass: "center",
  });

  return [
    {
      name: "link",
      tooltip: dictionary.createLink,
      icon: LinkIcon,
      active: isMarkActive(schema.marks.link),
      attrs: { href: "" },
    },
    {
      name: "separator",
    },
    {
      name: "placeholder",
      tooltip: dictionary.placeholder,
      icon: InputIcon,
      active: isMarkActive(schema.marks.placeholder),
      visible: isTemplate,
    },
    {
      name: "separator",
      visible: isTemplate,
    },
    {
      name: "strong",
      tooltip: dictionary.strong,
      icon: BoldIcon,
      active: isMarkActive(schema.marks.strong),
    },
    {
      name: "em",
      tooltip: dictionary.em,
      icon: ItalicIcon,
      active: isMarkActive(schema.marks.em),
    },
    {
      name: "strikethrough",
      tooltip: dictionary.strikethrough,
      icon: StrikethroughIcon,
      active: isMarkActive(schema.marks.strikethrough),
    },
    {
      name: "mark",
      tooltip: dictionary.mark,
      icon: HighlightIcon,
      active: isMarkActive(schema.marks.mark),
      visible: !isTemplate,
    },
    {
      name: "code_inline",
      tooltip: dictionary.codeInline,
      icon: CodeIcon,
      active: isMarkActive(schema.marks.code_inline),
    },
    {
      name: "blockquote",
      tooltip: dictionary.quote,
      icon: BlockQuoteIcon,
      active: isNodeActive(schema.nodes.blockquote),
      attrs: { level: 2 },
      visible: allowBlocks,
    },
    {
      name: "separator",
    },
    {
      name: "alignTextLeft",
      tooltip: dictionary.alignLeft,
      icon: AlignLeftIcon,
      active: isLeftAligned,
    },
    {
      name: "alignTextCenter",
      tooltip: dictionary.alignCenter,
      icon: AlignCenterIcon,
      active: isCenterAligned,
    },
    {
      name: "alignTextRight",
      tooltip: dictionary.alignRight,
      icon: AlignRightIcon,
      active: isRightAligned,
    },
    {
      name: "add_flashcard",
      tooltip: dictionary.quote,
      text: "+ Flashcard",
      visible: true,
    },
  ];
}
