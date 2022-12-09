const playerNames: string[] = [
  "random name 1",
  "random name 2",
  "random name 3",
  "random name 4",
  "random name 5",
];

type PlayerNumbers = Array<{
  idx: number;
  isFree: boolean;
}>;
const playerNumbers: PlayerNumbers = [
  {
    idx: 0,
    isFree: true,
  },
  {
    idx: 1,
    isFree: true,
  },
  {
    idx: 2,
    isFree: true,
  },
  {
    idx: 3,
    isFree: true,
  },
];

export { playerNames, playerNumbers };
