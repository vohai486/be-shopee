"use strict";

const cartModel = require("../cart.model");

const findCartByUserId = async (userId) => {
  return await cartModel
    .findOne({ cart_user: userId, cart_sate: "active" })
    .lean();
};
const findCartById = async (id) => {
  return await cartModel.findOne({ _id: id, cart_sate: "active" }).lean();
};
const findCartAndUpdate = async (query, bodyUpdate) => {
  return await cartModel.findOneAndUpdate(query, bodyUpdate, {
    new: true,
  });
};

module.exports = { findCartByUserId, findCartById, findCartAndUpdate };
