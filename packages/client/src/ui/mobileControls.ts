import type { GameClient } from "@neu5/types/src";
import type { DialogWrapper } from "../ui/dialog";

const isTouchDevice = () => "ontouchstart" in window;

const pEl = document.createElement("p");
pEl.textContent =
  "The game may be more playable if you rotate the screen horizontally";

const updateControls = ({
  dialog,
  game,
  mobileControlsEls,
}: {
  dialog: DialogWrapper;
  game: GameClient;
  mobileControlsEls: HTMLElement[];
}) => {
  if (isTouchDevice()) {
    mobileControlsEls.forEach((el) => el.classList.remove("hide"));
  } else {
    mobileControlsEls.forEach((el) => el.classList.add("hide"));
  }

  if (isTouchDevice() && game.windowSize.width / game.windowSize.height < 1) {
    dialog.show({
      content: pEl,
    });
  }
};

const updateWindowSize = (game: GameClient) => {
  game.windowSize = {
    width: window.innerWidth,
    height: window.innerHeight,
  };
};

const MobileControls = {
  updateControls,
  updateWindowSize,
};

export { MobileControls };
