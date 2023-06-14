class SessionStore {
  findSession(id: string) {}

  saveSession(id: string, session): void {}

  findAllSessions() {}
}

class InMemorySessionStore extends SessionStore {
  sessions;

  constructor() {
    super();
    this.sessions = new Map();
  }

  findSession(id: string) {
    return this.sessions.get(id);
  }

  saveSession(id: string, session: string) {
    this.sessions.set(id, session);
  }

  findAllSessions() {
    return [...this.sessions.values()];
  }
}

export { InMemorySessionStore };
