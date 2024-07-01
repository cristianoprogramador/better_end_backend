import { MongoClient } from "mongodb";

export const databaseProviders = [
  {
    provide: "MONGO_CONNECTION",
    useFactory: async () => {
      const client = new MongoClient("mongodb://127.0.0.1:27017", {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 60000,
      });

      await client.connect();
      return client.db("better-end");
    },
  },
];
