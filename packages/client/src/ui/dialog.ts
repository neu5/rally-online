const DIALOG_WRAPPER_CLASSNAME = "dialog-wrapper";
const DIALOG_CLASSNAME = "dialog";
const DIALOG_CLOSE_BUTTON_CLASSNAME = "dialog-header__close-button";
const DIALOG_CONTENT_CLASSNAME = "dialog-content";
const DIALOG_FOOTER_CLASSNAME = "dialog-footer";

export class UIDialogWrapper {
  dialogWrapper: Element;

  dialog: Element;

  dialogCloseButton: Element;

  dialogContent: Element;

  dialogFooter: Element;

  constructor() {
    const [dialogWrapper] = document.getElementsByClassName(
      DIALOG_WRAPPER_CLASSNAME
    );
    const [dialog] = document.getElementsByClassName(DIALOG_CLASSNAME);
    const [dialogCloseButton] = document.getElementsByClassName(
      DIALOG_CLOSE_BUTTON_CLASSNAME
    );
    const [dialogContent] = document.getElementsByClassName(
      DIALOG_CONTENT_CLASSNAME
    );
    const [dialogFooter] = document.getElementsByClassName(
      DIALOG_FOOTER_CLASSNAME
    );

    this.dialogWrapper = dialogWrapper;
    this.dialog = dialog;
    this.dialogCloseButton = dialogCloseButton;
    this.dialogContent = dialogContent;
    this.dialogFooter = dialogFooter;

    dialogCloseButton?.addEventListener("click", () => {
      this.close();
    });
  }

  close() {
    this.dialogWrapper.classList.add("hide");
  }

  private setContent(content: Node) {
    this.dialogContent.textContent = "";

    if (content) {
      this.dialogContent.appendChild(content);
    }
  }

  private setFooter(footer?: Node) {
    this.dialogFooter.textContent = "";

    if (footer) {
      this.dialogFooter.appendChild(footer);
    }
  }

  show({ content, footer }: { content: Node; footer?: Node }) {
    this.setContent(content);
    this.setFooter(footer);

    this.dialogWrapper.classList.remove("hide");
  }
}
