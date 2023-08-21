const EVENTS = {
  setName: ({
    input,
    rootEl,
  }: {
    input: HTMLInputElement;
    rootEl: HTMLElement;
  }) => {
    const event = new CustomEvent("setName", {
      detail: input.value,
    });

    rootEl.dispatchEvent(event);
  },
} as const;

export { EVENTS };
