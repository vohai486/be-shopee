const orderModel = require("../order.model");

exports.findOneAndUpdate = async (query, bodyUpdate) => {
  return await orderModel.findOneAndUpdate(query, bodyUpdate, {
    new: true,
  });
};
