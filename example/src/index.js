import * as React from "react";
import debounce from "lodash/debounce";
import ReactDOM from "react-dom";
import Editor from "../../src";

// to publish, build with node 10, then publish with node 15
const element = document.getElementById("main");
const savedText = localStorage.getItem("saved");
const exampleText = `
# Welcome

This is example content. It is persisted between reloads in localStorage.
`;
const defaultValue = savedText || exampleText;

const docSearchResults = [
  {
    title: "Hiring",
    subtitle: "Created by Jane",
    url: "/doc/hiring",
  },
  {
    title: "Hiring1",
    url: "/doc/hiring",
  },
  {
    title: "Hiring2",
    url: "/doc/hiring",
  },
  {
    title: "Hiring3",
    url: "/doc/hiring",
  },
  {
    title: "Hiring4",
    url: "/doc/hiring",
  },
  {
    title: "Hiring5",
    url: "/doc/hiring",
  },
  {
    title: "Hiring6",
    url: "/doc/hiring",
  },
  {
    title: "Hiring7",
    url: "/doc/hiring",
  },
  {
    title: "Hiring8",
    url: "/doc/hiring",
  },
  {
    title: "Hiring9",
    url: "/doc/hiring",
  },
  {
    title: "Hiring10",
    url: "/doc/hiring",
  },
  {
    title: "Hiring11",
    url: "/doc/hiring",
  },
  {
    title: "Hiring12",
    url: "/doc/hiring",
  },
  {
    title: "Hiring13",
    url: "/doc/hiring",
  },
  {
    title: "Hiring14",
    url: "/doc/hiring",
  },
  {
    title: "Hiring15",
    url: "/doc/hiring",
  },
  {
    title: "Hiring16",
    url: "/doc/hiring",
  },
  {
    title: "Hiring17",
    url: "/doc/hiring",
  },
  {
    title: "Hiring18",
    url: "/doc/hiring",
  },
  {
    title: "Hiring19",
    url: "/doc/hiring",
  },
  {
    title: "Hiring20",
    url: "/doc/hiring",
  },
  {
    title: "Product Roadmap",
    url: "/doc/product-roadmap",
  },
  {
    title: "Finances",
    url: "/doc/finances",
  },
  {
    title: "Super secret stuff",
    url: "/doc/secret-stuff",
  },
  {
    title: "Meeting notes",
    url: "/doc/meeting-notes",
  },
];

const onCreateFlashcard = (txt, surroundingTxt) =>
  console.log(`txt`, txt, surroundingTxt);

class YoutubeEmbed extends React.Component {
  render() {
    const { attrs } = this.props;
    const videoId = attrs.matches[1];

    return (
      <iframe
        className={this.props.isSelected ? "ProseMirror-selectednode" : ""}
        src={`https://www.youtube.com/embed/${videoId}?modestbranding=1`}
      />
    );
  }
}

class AudioEmbed extends React.Component {
  render() {
    const { attrs } = this.props;
    const mp3 = attrs.href;
    return <audio src={mp3} id={mp3} controls />;
  }
}

class Example extends React.Component {
  state = {
    readOnly: false,
    template: false,
    dark: localStorage.getItem("dark") === "enabled",
    value: undefined,
  };

  handleToggleReadOnly = () => {
    this.setState({ readOnly: !this.state.readOnly });
  };

  handleToggleTemplate = () => {
    this.setState({ template: !this.state.template });
  };

  handleToggleDark = () => {
    const dark = !this.state.dark;
    this.setState({ dark });
    localStorage.setItem("dark", dark ? "enabled" : "disabled");
  };

  handleUpdateValue = () => {
    const existing = localStorage.getItem("saved") || "";
    const value = `${existing}\n\nedit!`;
    localStorage.setItem("saved", value);

    this.setState({ value });
  };

  handleChange = debounce(value => {
    const text = value();
    localStorage.setItem("saved", text);
    console.log(`SAVED`, text);
  }, 250);

  render() {
    const { body } = document;
    if (body) body.style.backgroundColor = this.state.dark ? "#181A1B" : "#FFF";

    return (
      <div>
        <div style={{ overflowY: "auto" }}>
          <br />
          <button type="button" onClick={this.handleToggleReadOnly}>
            {this.state.readOnly ? "Switch to Editable" : "Switch to Read-only"}
          </button>{" "}
          <button type="button" onClick={this.handleToggleDark}>
            {this.state.dark ? "Switch to Light" : "Switch to Dark"}
          </button>{" "}
          <button type="button" onClick={this.handleToggleTemplate}>
            {this.state.template ? "Switch to Document" : "Switch to Template"}
          </button>{" "}
          <button type="button" onClick={this.handleUpdateValue}>
            Update value
          </button>
        </div>
        <br />
        <br />
        <Editor
          id="example"
          onCreateFlashcard={onCreateFlashcard}
          onMakeAnswer={txt => console.log(`make answer`, txt)}
          editorMinHeight="400px"
          readOnly={this.state.readOnly}
          newLinePlaceholder={"Hello"}
          readOnlyWriteCheckboxes
          value={this.state.value}
          enableTemplatePlaceholder={true}
          template={this.state.template}
          defaultValue={defaultValue}
          scrollTo={window.location.hash}
          getPlaceHolderLink={title => `/test/${title}`}
          handleDOMEvents={{
            focus: () => console.log("FOCUS"),
            blur: () => console.log("BLUR"),
            paste: (view, event) => console.log("PASTE", view, event),
            touchstart: () => console.log("TOUCH START"),
          }}
          onSave={options => console.log("Save triggered", options)}
          onCancel={() => console.log("Cancel triggered")}
          onChange={this.handleChange}
          onClickLink={(href, e) => console.log("Clicked link: ", href, e)}
          onHoverLink={event => {
            console.log("Hovered link: ", event.target.href);
            return false;
          }}
          onClickHashtag={tag => console.log("Clicked hashtag: ", tag)}
          onCreateLink={title => {
            // Delay to simulate time taken for remote API request to complete
            return new Promise((resolve, reject) => {
              setTimeout(() => {
                if (title !== "error") {
                  return resolve(
                    `/doc/${encodeURIComponent(title.toLowerCase())}`
                  );
                } else {
                  reject("500 error");
                }
              }, 1500);
            });
          }}
          LinkFinder={() => <div>HELLO</div>}
          onShowToast={message => window.alert(message)}
          onSearchLink={async (term, setter) => {
            console.log("Searched link: ", term);

            // Delay to simulate time taken for remote API request to complete
            return new Promise(resolve => {
              setTimeout(() => {
                const result = docSearchResults.filter(result =>
                  result.title.toLowerCase().includes(term.toLowerCase())
                );
                setter({ user: result });
              }, Math.random() * 500);
            });
          }}
          uploadImage={file => {
            console.log("File upload triggered: ", file);

            // Delay to simulate time taken to upload
            return new Promise(resolve => {
              setTimeout(
                () => resolve("https://loremflickr.com/1000/1000"),
                1500
              );
            });
          }}
          uploadAudio={file => {
            console.log("File upload triggered: ", file);

            // Delay to simulate time taken to upload
            return new Promise(resolve => {
              setTimeout(
                () => resolve("https://www.purpleculture.net/mp3/yuan1.mp3"),
                1500
              );
            });
          }}
          embeds={[
            {
              title: "YouTube",
              keywords: "youtube video tube google",
              icon: () => (
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/7/75/YouTube_social_white_squircle_%282017%29.svg"
                  width={24}
                  height={24}
                />
              ),
              matcher: url => {
                return url.match(
                  /(?:https?:\/\/)?(?:www\.)?youtu\.?be(?:\.com)?\/?.*(?:watch|embed)?(?:.*v=|v\/|\/)([a-zA-Z0-9_-]{11})$/i
                );
              },
              component: YoutubeEmbed,
            },
            {
              title: "Audio link",
              keywords: "audio mp3",
              icon: () => (
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/7/75/YouTube_social_white_squircle_%282017%29.svg"
                  width={24}
                  height={24}
                />
              ),
              matcher: url => {
                // FIXME support audio commonly used in language learning, like google translate, baidu in general
                const isAudio = url.match(
                  /(?:https?:\/\/)?.*.(?:wav|mp3|ogg|m4a|&spd=2|mp3)(\?alt.*|)$/i
                );
                return isAudio;
              },
              component: AudioEmbed,
            },
          ]}
          dark={this.state.dark}
          autoFocus
          placeholders={"Write stuff"}
        />
      </div>
    );
  }
}

if (element) {
  ReactDOM.render(<Example />, element);
}
