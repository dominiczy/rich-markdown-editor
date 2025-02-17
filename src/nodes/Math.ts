import styled from "styled-components";

import {
  chainCommands,
  deleteSelection,
  selectNodeBackward,
  joinBackward,
} from "prosemirror-commands";
import {
  mathPlugin,
  mathBackspaceCmd,
  insertMathCmd,
  makeInlineMathInputRule,
  REGEX_INLINE_MATH_DOLLARS,
} from "@benrbray/prosemirror-math";
import Node from "./Node";
import "katex/dist/katex.min.css";
import "@benrbray/prosemirror-math/style/math.css";

export default class Math extends Node {
  get name() {
    return "math_inline";
  }

  get schema() {
    return {
      group: "inline math",
      content: "text*",
      inline: true,
      atom: true,
      toDOM: () => ["math-inline", { class: "math-node" }, 0],
      parseDOM: [
        {
          tag: "math-inline",
        },
      ],
    };
  }

  commands({ type }) {
    return () => insertMathCmd(type);
  }

  inputRules({ schema }) {
    return [
      makeInlineMathInputRule(
        REGEX_INLINE_MATH_DOLLARS,
        schema.nodes.math_inline
      ),
    ];
  }

  keys({ type }) {
    return {
      "Mod-Space": insertMathCmd(type),
      Backspace: chainCommands(
        deleteSelection,
        mathBackspaceCmd,
        joinBackward,
        selectNodeBackward
      ),
    };
  }

  get plugins() {
    return [mathPlugin];
  }

  toMarkdown(state, node) {
    state.write("$");
    // do not escape backslashes like for \frac
    // state.renderInline(node);
    state.text(node.textContent, false);
    state.write("$");
  }

  parseMarkdown() {
    return {
      node: "math_inline",
      block: "math_inline",
      noCloseToken: "math_inline",
    };
  }
}
