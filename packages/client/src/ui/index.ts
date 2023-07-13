import { DialogWrapper } from "./dialog";
import type { UI, UsersList } from "@neu5/types/src";

const [usersListEl] = document.getElementsByClassName(
  "users-list"
) as HTMLCollectionOf<HTMLElement>;

const createPlayersList = (usersList: UsersList) => {
  const fragment = new DocumentFragment();

  usersList.forEach(
    ({
      connected,
      userID,
      username,
    }: {
      connected: boolean;
      userID: string;
      username: string;
    }) => {
      const li = document.createElement("li");
      li.textContent = username;
      li.dataset.id = userID;

      li.classList.add("users-list__elem");

      if (connected) {
        li.classList.add("users-list__elem--connected");
      }

      fragment.appendChild(li);
    }
  );

  usersListEl.textContent = "";
  usersListEl.appendChild(fragment);
};

// const PlayersIndicators = (el: HTMLElement, playersMap: PlayersMap) => {
//   el.textContent = "";

//   const fragment = new DocumentFragment();

//   let indicators: HTMLElement[] = [];

//   for (let i = 0; i < 8; i++) {
//     const div = document.createElement("div");
//     div.classList.add("users-indicator");

//     const divName = document.createElement("div");
//     divName.classList.add("users-indicator__name");

//     const divIndicator = document.createElement("div");
//     divIndicator.classList.add("users-indicator__indicator");

//     div.appendChild(divName);
//     div.appendChild(divIndicator);

//     indicators.push(div);
//     fragment.appendChild(div);
//   }

//   let idx = 0;
//   playersMap.forEach((player) => {
//     const playerIndicator = indicators[idx];

//     const nameEl = playerIndicator.children[0];
//     nameEl.textContent = player.displayName;

//     player.UIindicator = playerIndicator;

//     idx = idx + 1;
//   });

//   el.appendChild(fragment);
// };

const setCurrentPlayer = (id: string) => {
  [...usersListEl.children].find((el: HTMLElement) => {
    if (el.dataset.id === id) {
      el.classList.add("you");
      return true;
    }
  });
};

const ui: UI = {
  createPlayersList,
  DialogWrapper,
  // PlayersIndicators,
  setCurrentPlayer,
};

export { ui };
