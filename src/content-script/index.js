import "babelify/polyfill";
import esprima from "esprima";
import estraverse from "estraverse";
import ghInjection from "github-injection";
import ghPageType from "github-page-type";
import $ from "jquery";

ghInjection(window, (err) => {
  if (err) {
    return;
  }

  // Is the current GitHub page a file in a repository?
  if (!ghPageType(window.location.href, ghPageType.REPOSITORY_BLOB)) {
    return;
  }

  // Is the file written in a supported language?
  let file = $(".final-path").text();
  if (!file.endsWith(".js")) {
    return;
  }

  // Is the toggle button already injected for this file?
  let toggleButton = $("#toggle-ast");
  if (toggleButton.length > 0) {
    return;
  }

  let fileElement = $(".file");
  let codeElement = fileElement.find(".blob-wrapper");
  let rawButton = fileElement.find("#raw-url");
  let astElement = $("<div />", { id: "ast" }).hide().appendTo(fileElement);

  // Inject the toggle button into the page.
  toggleButton = rawButton
  .clone()
  .text("AST")
  .attr("href", "#")
  .attr("id", "toggle-ast")
  .insertBefore(rawButton)
  .click(() => {
    if (toggleButton.text() === "AST") {
      codeElement.hide();
      astElement.show();
      toggleButton.text("Code");

      // Has the file's AST been rendered yet? If not, do it now.
      if (astElement.children().length <= 0) {
        $("<p />", { class: "load-in-progress" }).appendTo(astElement);

        $.get(rawButton.attr("href"))
        .always(() => astElement.empty())
        .done(data => renderAST(esprima.parse(data), astElement))
        .fail(() => $("<p />", { class: "load-failed" }).appendTo(astElement));
      }
    }
    else {
      astElement.hide();
      codeElement.show();
      toggleButton.text("AST");
    }
  });
});

function renderAST(ast, astElement) {
  let nodeElements = new Map();

  estraverse.traverse(ast, {
    enter: (node, parent) => {
      let parentElement = parent ? nodeElements.get(parent).children(".children") : astElement;
      let nodeElement = $("<div />", { class: "node" }).appendTo(parentElement);
      let typeElement = $("<div />", { class: "type", text: node.type }).appendTo(nodeElement);
      let childrenElement = $("<div />", { class: "children" }).hide().appendTo(nodeElement);
      typeElement.click(() => childrenElement.fadeToggle("fast"));
      nodeElements.set(node, nodeElement);
    }
  });
};