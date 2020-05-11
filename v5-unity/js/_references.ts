// augment existing interface definitions from typings/
interface JQuery {
  // attr can also take a boolean as a second argument
  attr(attributeName: string, b: boolean): JQuery;
}

interface JQueryStatic {
  doTimeout: any;
}

declare namespace AceAjax {
  interface IEditSession {
    setFoldStyle: any;
    setOption: any;
    gutterRenderer: any;
  }

  interface Editor {
    setHighlightGutterLine: any;
    setDisplayIndentGuides: any;
    on: any;
  }
}
