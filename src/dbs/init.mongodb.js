"use strict";
const mongoose = require("mongoose");
const connectString = process.env.MONGODB_URL;
class Database {
  constructor() {
    this.connect();
  }
  // connect
  connect(type = "mongodb") {
    // dev
    // if (1 === 1) {
    //   mongoose.set("debug", true);
    //   mongoose.set("debug", {
    //     color: true,
    //   });
    // }
    mongoose
      .connect(connectString, {
        maxPoolSize: 10,
      })
      .then(() => {
        console.log("Connected Mongodb success");
      })
      .catch((err) => console.log("Error Connect!"));
  }

  static getInstance() {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }
}

const instanceMongodb = Database.getInstance();

module.exports = instanceMongodb;
