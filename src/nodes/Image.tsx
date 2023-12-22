import { InputRule } from "prosemirror-inputrules";
import { NodeSelection, Plugin } from "prosemirror-state";
import { setTextSelection } from "prosemirror-utils";
import * as React from "react";
import ImageZoom from "react-medium-image-zoom";
import styled from "styled-components";
import insertFiles from "../commands/insertFiles";
import getDataTransferFiles from "../lib/getDataTransferFiles";
import uploadPlaceholderPlugin from "../lib/uploadPlaceholder";
import Node from "./Node";

/**
 * Matches following attributes in Markdown-typed image: [, alt, src, class]
 *
 * Example:
 * ![Lorem](image.jpg) -> [, "Lorem", "image.jpg"]
 * ![](image.jpg "class") -> [, "", "image.jpg", "small"]
 * ![Lorem](image.jpg "class") -> [, "Lorem", "image.jpg", "small"]
 */
const IMAGE_INPUT_REGEX = /!\[(?<alt>.*?)]\((?<filename>.*?)(?=\“|\))\“?(?<layoutclass>[^\”]+)?\”?\s?(?<sizeclass>[^\s]+)?\)/;

const uploadPlugin = (options) =>
  new Plugin({
    props: {
      handleDOMEvents: {
        paste(view, event: ClipboardEvent): boolean {
          if (
            (view.props.editable && !view.props.editable(view.state)) ||
            !options.uploadImage
          ) {
            return false;
          }

          if (!event.clipboardData) return false;

          // check if we actually pasted any files
          const files = Array.prototype.slice
            .call(event.clipboardData.items)
            .map((dt) => dt.getAsFile())
            .filter((file) => file);

          if (files.length === 0) return false;

          const { tr } = view.state;
          if (!tr.selection.empty) {
            tr.deleteSelection();
          }
          const pos = tr.selection.from;
          options.isImage = files[0].type.startsWith("image");
          options.isAudio = files[0].type.startsWith("audio");
          insertFiles(view, event, pos, files, options);
          return true;
        },
        drop(view, event: DragEvent): boolean {
          if (
            (view.props.editable && !view.props.editable(view.state)) ||
            !options.uploadImage
          ) {
            return false;
          }

          // filter to only include image files
          const files = getDataTransferFiles(event).filter((file) => file);
          if (files.length === 0) {
            return false;
          }

          // grab the position in the document for the cursor
          const result = view.posAtCoords({
            left: event.clientX,
            top: event.clientY,
          });

          if (result) {
            options.isImage = files[0].type.startsWith("image");
            options.isAudio = files[0].type.startsWith("audio");
            insertFiles(view, event, result.pos, files, options);
            return true;
          }

          return false;
        },
      },
    },
  });

const IMAGE_CLASSES = ["right", "left", "center", "small", "medium", "large"];
const getLayoutAndTitle = (tokenTitle) => {
  if (!tokenTitle) return {};
  if (IMAGE_CLASSES.includes(tokenTitle)) {
    return {
      layoutClass: tokenTitle,
      sizeClass: tokenTitle,
    };
  } else {
    return {
      title: tokenTitle,
    };
  }
};

export default class Image extends Node {
  get name() {
    return "image";
  }

  get schema() {
    return {
      inline: true,
      attrs: {
        src: {},
        alt: {
          default: null,
        },
        layoutClass: {
          default: null,
        },
        sizeClass: {
          default: null,
        },
        title: {
          default: null,
        },
      },
      content: "text*",
      marks: "",
      group: "inline",
      selectable: true,
      draggable: true,
      parseDOM: [
        {
          tag: "div[class~=image]",
          getAttrs: (dom: HTMLDivElement) => {
            const img = dom.getElementsByTagName("img")[0];
            const className = dom.className;
            const layoutClassMatched =
              className && className.match(/image-(.*)$/);
            const layoutClass = layoutClassMatched
              ? layoutClassMatched[1]
              : null;
            const sizeClassMatched =
              className && className.match(/image-(.*)$/);
            const sizeClass = sizeClassMatched ? sizeClassMatched[1] : null;
            return {
              src: img.getAttribute("src"),
              alt: img.getAttribute("alt"),
              title: img.getAttribute("title"),
              layoutClass: layoutClass,
              sizeClass: sizeClass,
            };
          },
        },
      ],
      toDOM: (node) => {
        const { layoutClass, sizeClass } = node.attrs;
        const className = `${layoutClass ? `image-${layoutClass}` : "image"} ${
          sizeClass ? `image-${sizeClass}` : ""
        }`;

        return [
          "div",
          {
            class: className,
          },
          ["img", { ...node.attrs, contentEditable: false }],
          ["p", { class: "caption" }, 0],
        ];
      },
    };
  }

  handleKeyDown = ({ node, getPos }) => (event) => {
    // Pressing Enter in the caption field should move the cursor/selection
    // below the image
    if (event.key === "Enter") {
      event.preventDefault();

      const { view } = this.editor;
      const pos = getPos() + node.nodeSize;
      view.focus();
      view.dispatch(setTextSelection(pos)(view.state.tr));
      return;
    }

    // Pressing Backspace in an an empty caption field should remove the entire
    // image, leaving an empty paragraph
    if (event.key === "Backspace" && event.target.innerText === "") {
      const { view } = this.editor;
      const $pos = view.state.doc.resolve(getPos());
      const tr = view.state.tr.setSelection(new NodeSelection($pos));
      view.dispatch(tr.deleteSelection());
      view.focus();
      return;
    }
  };

  handleBlur = ({ node, getPos }) => (event) => {
    const alt = event.target.innerText;
    const { src, title, layoutClass, sizeClass } = node.attrs;

    if (alt === node.attrs.alt) return;

    const { view } = this.editor;
    const { tr } = view.state;

    // update meta on object
    const pos = getPos();
    const transaction = tr.setNodeMarkup(pos, undefined, {
      src,
      alt,
      title,
      layoutClass,
      sizeClass,
    });
    view.dispatch(transaction);
  };

  handleSelect = ({ getPos }) => (event) => {
    event.preventDefault();

    const { view } = this.editor;
    const $pos = view.state.doc.resolve(getPos());
    const transaction = view.state.tr.setSelection(new NodeSelection($pos));
    view.dispatch(transaction);
  };

  component = (props) => {
    const { theme, isSelected } = props;
    const { alt, src, title, layoutClass } = props.node.attrs;
    const className = `${layoutClass ? `image image-${layoutClass}` : "image"}`;
    const readOnly = this.editor.props.readOnly;
    const isSvg = src.toLowerCase().endsWith(".svg");

    return (
      <div
        contentEditable={false}
        className={className}
        style={
          isSvg
            ? {
                position: "absolute",
                width: "100%",
                top: "1.4em",
                zIndex: 1,
              }
            : undefined
        }
      >
        <ImageWrapper
          className={isSelected ? "ProseMirror-selectednode" : ""}
          onClick={this.handleSelect(props)}
        >
          <div
            style={{
              pointerEvents: readOnly || isSelected ? "initial" : "none",
            }}
          >
            <ImageZoom
              image={{
                src,
                alt,
                title,
              }}
              defaultStyles={{
                overlay: {
                  backgroundColor: theme.background,
                },
                zoomContainer: {
                  zIndex: 1300,
                },
              }}
              shouldRespectMaxDimension
            />
          </div>
        </ImageWrapper>
        <Caption
          onKeyDown={this.handleKeyDown(props)}
          onBlur={this.handleBlur(props)}
          className="caption"
          tabIndex={-1}
          role={readOnly ? "" : "textbox"}
          contentEditable
          suppressContentEditableWarning
        >
          {alt}
        </Caption>
      </div>
    );
  };

  toMarkdown(state, node) {
    let markdown =
      " ![" +
      state.esc((node.attrs.alt || "").replace("\n", "") || "") +
      "](" +
      state.esc(node.attrs.src);
    if (node.attrs.layoutClass) {
      markdown += ' "' + state.esc(node.attrs.layoutClass) + '"';
    } else if (node.attrs.title) {
      markdown += ' "' + state.esc(node.attrs.title) + '"';
    }
    markdown += ")";
    state.write(markdown);
  }

  parseMarkdown() {
    return {
      node: "image",
      getAttrs: (token) => {
        return {
          src: token.attrGet("src"),
          alt: (token.children[0] && token.children[0].content) || null,
          ...getLayoutAndTitle(token.attrGet("title")),
        };
      },
    };
  }
  getCurrentLayoutClass = (state) => {
    let currentLayoutClass = state.selection.node.attrs.layoutClass;
    const currentSizeClass = state.selection.node.attrs.sizeClass;

    if (currentLayoutClass) {
      const firstIndex = currentLayoutClass.indexOf("-");

      currentLayoutClass =
        firstIndex !== -1
          ? currentLayoutClass.substring(0, firstIndex)
          : currentLayoutClass;
    }

    return currentLayoutClass === currentSizeClass ? "" : currentLayoutClass;
  };

  commands({ type }) {
    return {
      deleteImage: () => (state, dispatch) => {
        dispatch(state.tr.deleteSelection());
        return true;
      },
      alignRight: () => (state, dispatch) => {
        const currentSizeClass = state.selection.node.attrs.sizeClass;
        const attrs = {
          ...state.selection.node.attrs,
          title: null,
          layoutClass: currentSizeClass ? `right-${currentSizeClass}` : "right",
        };
        const { selection } = state;
        dispatch(state.tr.setNodeMarkup(selection.$from.pos, undefined, attrs));
        return true;
      },
      alignLeft: () => (state, dispatch) => {
        const currentSizeClass = state.selection.node.attrs.sizeClass;
        const attrs = {
          ...state.selection.node.attrs,
          title: null,
          layoutClass: currentSizeClass ? `left-${currentSizeClass}` : "left",
        };
        const { selection } = state;
        dispatch(state.tr.setNodeMarkup(selection.$from.pos, undefined, attrs));
        return true;
      },
      alignCenter: () => (state, dispatch) => {
        const currentSizeClass = state.selection.node.attrs.sizeClass;
        const attrs = {
          ...state.selection.node.attrs,
          layoutClass: currentSizeClass
            ? `center-${currentSizeClass}`
            : "center",
        };
        const { selection } = state;
        dispatch(state.tr.setNodeMarkup(selection.$from.pos, undefined, attrs));
        return true;
      },
      smallSize: () => (state, dispatch) => {
        const currentLayoutClass = this.getCurrentLayoutClass(state);

        const attrs = {
          ...state.selection.node.attrs,
          title: null,
          layoutClass: currentLayoutClass
            ? `${currentLayoutClass}-small`
            : "small",
          sizeClass: "small",
        };
        const { selection } = state;
        dispatch(state.tr.setNodeMarkup(selection.$from.pos, undefined, attrs));
        return true;
      },
      mediumSize: () => (state, dispatch) => {
        const currentLayoutClass = this.getCurrentLayoutClass(state);

        const attrs = {
          ...state.selection.node.attrs,
          title: null,
          layoutClass: currentLayoutClass
            ? `${currentLayoutClass}-medium`
            : "medium",
          sizeClass: "medium",
        };
        const { selection } = state;
        dispatch(state.tr.setNodeMarkup(selection.$from.pos, undefined, attrs));
        return true;
      },
      largeSize: () => (state, dispatch) => {
        const currentLayoutClass = this.getCurrentLayoutClass(state);

        const attrs = {
          ...state.selection.node.attrs,
          layoutClass: currentLayoutClass
            ? `${currentLayoutClass}-large`
            : "large",
          sizeClass: "large",
        };
        const { selection } = state;
        dispatch(state.tr.setNodeMarkup(selection.$from.pos, undefined, attrs));
        return true;
      },
      createImage: (attrs) => (state, dispatch) => {
        const { selection } = state;
        const position = selection.$cursor
          ? selection.$cursor.pos
          : selection.$to.pos;
        const node = type.create(attrs);
        const transaction = state.tr.insert(position, node);
        dispatch(transaction);
        return true;
      },
    };
  }

  inputRules({ type }) {
    return [
      new InputRule(IMAGE_INPUT_REGEX, (state, match, start, end) => {
        const [okay, alt, src, matchedTitle] = match;
        const { tr } = state;
        if (okay) {
          tr.replaceWith(
            start - 1,
            end,
            type.create({
              src,
              alt,
              ...getLayoutAndTitle(matchedTitle),
            })
          );
        }

        return tr;
      }),
    ];
  }

  get plugins() {
    return [uploadPlaceholderPlugin, uploadPlugin(this.options)];
  }
}

const ImageWrapper = styled.span`
  line-height: 0;
  display: inline-block;
`;

const Caption = styled.p`
  border: 0;
  display: block;
  font-size: 13px;
  font-style: italic;
  color: ${(props) => props.theme.textSecondary};
  padding: 2px 0;
  line-height: 16px;
  text-align: center;
  min-height: 1em;
  outline: none;
  background: none;
  resize: none;
  user-select: text;
  cursor: text;

  &:empty:before {
    color: ${(props) => props.theme.placeholder};
    content: "${(props) => (props.role ? "Write a caption" : "")}";
    pointer-events: none;
  }
`;
