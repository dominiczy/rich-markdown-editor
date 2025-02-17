import * as React from "react";
import { EditorState } from "prosemirror-state";

export enum ToastType {
  Error = "error",
  Info = "info",
}

export type MenuItem = {
  icon?: typeof React.Component | React.FC<any>;
  name?: string;
  title?: string;
  text?: string;
  shortcut?: string;
  keywords?: string;
  memberOnly?: boolean;
  tooltip?: string;
  attrs?: Record<string, any>;
  visible?: boolean;
  active?: (state: EditorState) => boolean;
};

export type EmbedDescriptor = MenuItem & {
  matcher: (url: string) => boolean | [];
  component: typeof React.Component | React.FC<any>;
};
