import { PlayersList } from "../main";

export const UIcreatePlayersList = (el: HTMLElement, list: PlayersList) => {
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

export const UIsetCurrentPlayer = (playersListEl: HTMLElement, id: string) => {
  [...playersListEl.children].find((el: HTMLElement) => {
    if (el.dataset.id === id) {
      el.classList.add("you");
      return true;
    }

    return false;
  });
};
