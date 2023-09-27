import { EVENTS } from "../events/events";

const DIALOG_WRAPPER_CLASSNAME = "dialog-wrapper";
const DIALOG_CLASSNAME = "dialog";
const DIALOG_CLOSE_BUTTON_CLASSNAME = "dialog-header__close-button";
const DIALOG_CONTENT_CLASSNAME = "dialog-content";
const DIALOG_FOOTER_CLASSNAME = "dialog-footer";

type Dialog = {
  content: Node;
  footer?: Node;
  inputToLook?: HTMLInputElement;
  closeButtonVisibility: boolean;
};

export class DialogWrapper {
  dialogWrapper: Element;

  dialog: Element;

  dialogs: Array<Dialog>;

  dialogCloseButton: Element;

  dialogContent: Element;

  dialogFooter: Element;

  inputToLook: HTMLInputElement | null;

  constructor({ rootEl }: { rootEl: HTMLElement | null }) {
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
    this.dialogs = [];
    this.dialogCloseButton = dialogCloseButton;
    this.dialogContent = dialogContent;
    this.dialogFooter = dialogFooter;

    dialogCloseButton?.addEventListener("click", () => {
      this.close();
    });

    this.inputToLook = null;

    dialogContent.addEventListener("keydown", (ev) => {
      // @ts-ignore
      if (ev.key === "Enter" && this.inputToLook && rootEl) {
        EVENTS.setName({ input: this.inputToLook, rootEl });
      }
    });

    dialogContent.addEventListener("click", (ev: Event) => {
      const element = ev.target as HTMLButtonElement;

      if (element?.type === "submit" && this.inputToLook && rootEl) {
        EVENTS.setName({ input: this.inputToLook, rootEl });
      }
    });
  }

  close() {
    this.dialogWrapper.classList.add("hide");

    if (this.dialogs.length > 0) {
      this.render(this.dialogs[0]);
    }
  }

  isDialogHidden() {
    return this.dialogWrapper.classList.contains("hide");
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

  private setCloseButtonVisibility(showCloseButton: boolean) {
    if (showCloseButton) {
      this.dialogCloseButton.classList.remove("hide");
    } else {
      this.dialogCloseButton.classList.add("hide");
    }
  }

  show({ content, footer, inputToLook, closeButtonVisibility = true }: Dialog) {
    this.dialogs.push({ content, footer, inputToLook, closeButtonVisibility });

    if (this.isDialogHidden()) {
      this.render({ content, footer, inputToLook, closeButtonVisibility });
    }
  }

  render({ content, footer, inputToLook, closeButtonVisibility }: Dialog) {
    this.dialogs.shift();

    this.setCloseButtonVisibility(closeButtonVisibility);
    this.setContent(content);
    this.setFooter(footer);

    if (inputToLook) {
      this.inputToLook = inputToLook;
    }

    this.dialogWrapper.classList.remove("hide");
  }
}
