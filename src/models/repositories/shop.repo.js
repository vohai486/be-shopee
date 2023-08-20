const { STATUS } = require("../../constants/status");
const shopModel = require("../shop.model");

exports.findOneShop = async (id, select = {}) => {
  return await shopModel
    .findOne({
      _id: id,
      shop_status: STATUS.ACTIVE,
    })
    .select(select)
    .lean();
};
exports.findShopById = async (id, select = {}) => {
  return await shopModel.findById(id).select(select).lean();
};
exports.updateShop = async (id, bodyUpdate) => {
  return await shopModel.findByIdAndUpdate(id, bodyUpdate, {
    new: true,
  });
};
