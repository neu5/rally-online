import { DialogWrapper } from "./dialog";
import type { PlayersMap } from "../main";
import type { UI } from "@neu5/types/src";

const playersListEl = document.getElementById("players-list") as HTMLElement;

const createPlayersList = (list: PlayersMap) => {
  const fragment = new DocumentFragment();

  list.forEach(({ displayName }) => {
    const li = document.createElement("li");
    li.textContent = displayName;
    li.dataset.id = displayName;

    fragment.appendChild(li);
  });

  playersListEl.textContent = "";
  playersListEl.appendChild(fragment);
};

const PlayersIndicators = (el: HTMLElement, playersMap: PlayersMap) => {
  el.textContent = "";

  const fragment = new DocumentFragment();

  let indicators: HTMLElement[] = [];

  for (let i = 0; i < 8; i++) {
    const div = document.createElement("div");
    div.classList.add("players-indicator");

    const divName = document.createElement("div");
    divName.classList.add("players-indicator__name");

    const divIndicator = document.createElement("div");
    divIndicator.classList.add("players-indicator__indicator");

    div.appendChild(divName);
    div.appendChild(divIndicator);

    indicators.push(div);
    fragment.appendChild(div);
  }

  let idx = 0;
  playersMap.forEach((player) => {
    const playerIndicator = indicators[idx];

    const nameEl = playerIndicator.children[0];
    nameEl.textContent = player.displayName;

    player.UIindicator = playerIndicator;

    idx = idx + 1;
  });

  el.appendChild(fragment);
};

const setCurrentPlayer = (playersListEl: HTMLElement, id: string) => {
  // @ts-ignore
  [...playersListEl.children].find((el: HTMLElement) => {
    if (el.dataset.id === id) {
      el.classList.add("you");
      return true;
    }

    return false;
  });
};

const ui: UI = {
  createPlayersList,
  // DialogWrapper,
  // PlayersIndicators,
  // setCurrentPlayer,
};

export { ui };
