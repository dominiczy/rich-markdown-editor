import { Plugin } from "prosemirror-state";
import { toggleMark } from "prosemirror-commands";
import Extension from "../lib/Extension";
import isUrl from "../lib/isUrl";
import isInCode from "../queries/isInCode";

const LINK_INPUT_REGEX = /^\[(.+)]\((\S+)\)$/;

export default class MarkdownPaste extends Extension {
  get name() {
    return "markdown-paste";
  }

  get plugins() {
    return [
      new Plugin({
        props: {
          handlePaste: (view, event: ClipboardEvent) => {
            if (view.props.editable && !view.props.editable(view.state)) {
              return false;
            }
            if (!event.clipboardData) return false;

            const text = event.clipboardData.getData("text/plain");
            const html = event.clipboardData.getData("text/html");
            const { state, dispatch } = view;

            this.options.onPaste(text);

            // [hi](/dominiczijlstra/gfcek2fp7un0nzc079n78n59)
            const mdLink = text.match(LINK_INPUT_REGEX);
            console.log(`mdLink`, mdLink, text);
            if (mdLink) {
              const [, txt, lnk] = mdLink;
              console.log(`md link`, txt, lnk);
              const transaction = view.state.tr
                .insertText(txt, state.selection.from, state.selection.to)
                .addMark(
                  state.selection.from,
                  state.selection.to + txt.length,
                  state.schema.marks.link.create({ href: lnk })
                );
              view.dispatch(transaction);
              return true;
            }

            // first check if the clipboard contents can be parsed as a url
            if (isUrl(text)) {
              // just paste the link mark directly onto the selected text
              if (!state.selection.empty) {
                toggleMark(this.editor.schema.marks.link, { href: text })(
                  state,
                  dispatch
                );
                return true;
              }

              // Is this link embeddable? Create an embed!
              const { embeds } = this.editor.props;

              if (embeds) {
                for (const embed of embeds) {
                  const matches = embed.matcher(text);
                  if (matches) {
                    this.editor.commands.embed({
                      href: text,
                      component: embed.component,
                      matches,
                    });
                    return true;
                  }
                }
              }

              // DZ: Copied this bit from newer rich-markdown-editor, does it substitute my commented out bit below?
              // well, it's not an embed and there is no text selected – so just
              // go ahead and insert the link directly
              const transaction = view.state.tr
                .insertText(text, state.selection.from, state.selection.to)
                .addMark(
                  state.selection.from,
                  state.selection.to + text.length,
                  state.schema.marks.link.create({ href: text })
                );
              view.dispatch(transaction);
              return true;
            }

            // otherwise, if we have html on the clipboard then fallback to the
            // default HTML parser behavior that comes with Prosemirror.
            if (text.length === 0 || html) return false;

            event.preventDefault();

            if (isInCode(view.state)) {
              view.dispatch(view.state.tr.insertText(text));
              return true;
            }

            // if (isUrl(text)) {
            //   // turn plaintext url into clickable
            //   text = `<${text}>`;
            // }

            const paste = this.editor.parser.parse(text);
            const slice = paste.slice(0);

            const transaction = view.state.tr.replaceSelection(slice);
            view.dispatch(transaction);
            return true;
          },
        },
      }),
    ];
  }
}
