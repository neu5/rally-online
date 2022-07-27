import type { PlayersMap } from "../main";

const UIcreatePlayersList = (el: HTMLElement, list: PlayersMap) => {
  const fragment = new DocumentFragment();

  list.forEach(({ name }) => {
    const li = document.createElement("li");
    li.textContent = name;
    li.dataset.id = name;

    fragment.appendChild(li);
  });

  el.textContent = "";
  el.appendChild(fragment);
};

type Dialog = {
  message: string;
  isClosable?: boolean;
};

const UIDialog = ({ message, isClosable = true }: Dialog) => {
  const fragment = new DocumentFragment();

  const div = document.createElement("div");
};

const UIsetCurrentPlayer = (playersListEl: HTMLElement, id: string) => {
  // @ts-ignore
  [...playersListEl.children].find((el: HTMLElement) => {
    if (el.dataset.id === id) {
      el.classList.add("you");
      return true;
    }

    return false;
  });
};

export { UIcreatePlayersList, UIDialog, UIsetCurrentPlayer };
