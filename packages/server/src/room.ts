class Room {
  room;

  constructor() {
    this.room = new Map();
  }

  getMembers() {
    return [...this.room.values()];
  }

  join(memberID: string) {
    this.room.set(memberID, memberID);
  }

  leave(memberID: string) {
    this.room.delete(memberID);
  }
}

export { Room };
