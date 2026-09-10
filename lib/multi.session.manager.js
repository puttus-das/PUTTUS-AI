const { MongoClient } = require("mongodb");
const {
  initAuthCreds,
  BufferJSON,
  proto,
  AuthenticationState,
} = require("@whiskeysockets/baileys");

class MultiSessionManager {
  constructor({ mongoUrl, database = "puttus_xd", collection = "sessions" } = {}) {
    if (!mongoUrl) throw new Error("MONGO_URL is not configured");
    this.mongoUrl = mongoUrl;
    this.databaseName = database;
    this.collectionName = collection;
    this.client = null;
    this.collection = null;
    this.sessions = new Map();
  }

  async connect() {
    if (this.collection) return;
    this.client = new MongoClient(this.mongoUrl, { serverSelectionTimeoutMS: 15000 });
    await this.client.connect();
    this.collection = this.client.db(this.databaseName).collection(this.collectionName);
    await this.collection.createIndex({ userId: 1, type: 1, id: 1 }, { unique: true });
  }

  key(userId) {
    return String(userId);
  }

  async load(userId, type, id) {
    const doc = await this.collection.findOne({ userId: this.key(userId), type, id });
    return doc ? JSON.parse(JSON.stringify(doc.value), BufferJSON.reviver) : null;
  }

  async save(userId, type, id, value) {
    await this.collection.updateOne(
      { userId: this.key(userId), type, id },
      { $set: { userId: this.key(userId), type, id, value: JSON.parse(JSON.stringify(value, BufferJSON.replacer)), updatedAt: new Date() } },
      { upsert: true },
    );
  }

  async delete(userId, type, id) {
    await this.collection.deleteOne({ userId: this.key(userId), type, id });
  }

  async authState(userId) {
    await this.connect();
    const uid = this.key(userId);
    const savedCreds = await this.load(uid, "creds", "main");
    const creds = savedCreds || initAuthCreds();
    const keys = {
      get: async (type, ids) => {
        const out = {};
        for (const id of ids) {
          const value = await this.load(uid, "key", `${type}-${id}`);
          if (value) out[id] = type === "app-state-sync-key" ? proto.Message.AppStateSyncKeyData.fromObject(value) : value;
        }
        return out;
      },
      set: async (data) => {
        for (const [type, entries] of Object.entries(data)) {
          for (const [id, value] of Object.entries(entries)) {
            if (value) await this.save(uid, "key", `${type}-${id}`, value);
            else await this.delete(uid, "key", `${type}-${id}`);
          }
        }
      },
    };
    return { state: { creds, keys }, saveCreds: () => this.save(uid, "creds", "main", creds) };
  }

  async setMeta(userId, patch) {
    await this.connect();
    await this.collection.updateOne(
      { userId: this.key(userId), type: "meta", id: "main" },
      { $set: { userId: this.key(userId), type: "meta", id: "main", ...patch, updatedAt: new Date() } },
      { upsert: true },
    );
  }

  async getMeta(userId) {
    await this.connect();
    return this.collection.findOne({ userId: this.key(userId), type: "meta", id: "main" });
  }

  async clear(userId) {
    await this.connect();
    await this.collection.deleteMany({ userId: this.key(userId) });
    this.sessions.delete(this.key(userId));
  }

  async close() {
    for (const sock of this.sessions.values()) {
      try { sock.end(undefined); } catch {}
    }
    if (this.client) await this.client.close();
  }
}

module.exports = MultiSessionManager;
/* AuthenticationState is intentionally imported above to document the Baileys state contract. */
void AuthenticationState;
void BufferJSON;
