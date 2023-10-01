"use strict";

const util = require("util");
const redis = require("redis");
const {
  reservationInventory,
} = require("../models/repositories/inventory.repo");

// 6379
// const redisClient = redis.createClient({
//   host: "127.0.0.1",
//   port: 6379,
//   // url: "127.0.0.1:6379",
// });

const client = redis.createClient({
  host: "127.0.0.1",
  port: 6379,
});

client.on("connect", function () {
  console.log("Redis Connected!");
});

client.on("error", function (error) {
  console.error("Redis Error: ", error);
});

const pexpire = util.promisify(client.pexpire).bind(client);
const setnxAsync = util.promisify(client.setnx).bind(client);
const delAsyncKey = util.promisify(client.del).bind(client);

const acquireLock = async (productId, quantity, cartId) => {
  const key = `lock_v2023_${productId}`;
  const retryTimes = 10;
  const expireTime = 3000; // 3 seconds tam lock

  for (let i = 0; i < retryTimes; i++) {
    // tạo 1 key, ai nắm giữ được vào thanh toán
    const result = await setnxAsync(key, expireTime);
    if (result === 1) {
      // thao tác vs inventory
      const isReversation = await reservationInventory({
        inven_productId: productId,
        quantity,
        cartId,
      });
      await pexpire(key, expireTime);
      if (isReversation) {
        return key;
      }
      return null;
    } else {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
};

const releaseLock = async (keyLock) => {
  return await delAsyncKey(keyLock);
};

module.exports = {
  acquireLock,
  releaseLock,
};
