import type { User } from "@neu5/types/src";

class InMemorySessionStore {
  sessions;

  constructor() {
    this.sessions = new Map();
  }

  getAuthorizedUsers() {
    return [...this.sessions.values()].filter((user) => Boolean(user.username));
  }

  findSession(id: string) {
    return this.sessions.get(id);
  }

  saveSession(id: string, session: User) {
    this.sessions.set(id, session);
  }

  findAllSessions() {
    return [...this.sessions.values()];
  }
}

export { InMemorySessionStore };
