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
    this.dialogCloseButton = dialogCloseButton;
    this.dialogContent = dialogContent;
    this.dialogFooter = dialogFooter;

    dialogCloseButton?.addEventListener("click", () => {
      this.close();
    });

    this.inputToLook = null;

    dialogContent.addEventListener("click", (ev: Event) => {
      const element = ev.target as HTMLButtonElement;

      if (element?.type === "submit" && this.inputToLook && rootEl) {
        const event = new CustomEvent("setName", {
          detail: this.inputToLook.value,
        });

        rootEl.dispatchEvent(event);
      }
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

  private setCloseButtonVisibility(showCloseButton: boolean) {
    console.log({ showCloseButton });
    if (showCloseButton) {
      this.dialogCloseButton.classList.remove("hide");
    } else {
      this.dialogCloseButton.classList.add("hide");
    }
  }

  show({
    content,
    footer,
    inputToLook,
    closeButtonVisibility = true,
  }: {
    content: Node;
    footer?: Node;
    inputToLook?: HTMLInputElement;
    closeButtonVisibility?: boolean;
  }) {
    this.setCloseButtonVisibility(closeButtonVisibility);
    this.setContent(content);
    this.setFooter(footer);

    if (inputToLook) {
      this.inputToLook = inputToLook;
    }

    this.dialogWrapper.classList.remove("hide");
  }
}
