const { USER } = require("../constants/role.user");
const {
  BadRequestError,
  AuthFailureError,
  ForbiddenError,
  NotFoundRequestError,
} = require("../core/error.response");
const {
  findByEmail,
  findById,
  findByIdAndUpdate,
} = require("../models/repositories/user.repo");
const userModel = require("../models/user.model");
const crypto = require("crypto");
const { pickObjectKey } = require("../utils");
const KeyTokenService = require("./keytoken.service");
const bcrypt = require("bcrypt");
const { createTokenPair } = require("../utils/auth");
const shopModel = require("../models/shop.model");
const { STATUS } = require("../constants/status");
const { uploadFile } = require("../utils/upload");
const { Types } = require("mongoose");
const { updateShop } = require("../models/repositories/shop.repo");

class UserService {
  // user

  static async getProfile({ _id }) {
    const foundUser = await findById(_id);
    if (!foundUser) throw new NotFoundRequestError("Người dùng không tồn tại");
    return foundUser;
  }
  static async updateMe({ _id, ...body }) {
    const bodyUpdate = pickObjectKey(body, [
      "fullName",
      "gender",
      "date_of_birth",
      "phoneNumber",
    ]);
    const updateUser = await findByIdAndUpdate(_id, bodyUpdate);
    if (!updateUser) throw new BadRequestError("Cập nhật thất bại");
    return pickObjectKey(updateUser, [
      "fullName",
      "phoneNumber",
      "email",
      "_id",
      "avatar",
      "gender",
      "date_of_birth",
    ]);
  }
  static async uploadAvatar(req) {
    if (req.fileError || !req.body.image)
      throw new BadRequestError("Not an image! Please upload only images");
    const user = await userModel.findById(req.user.userId);
    const userUpdate = await uploadFile(req, "avatar_user", user, "avatar");
    if (!userUpdate.isModified("avatar") && !userUpdate)
      throw new BadRequestError("Cập nhật thất bại");
    return 1;
  }
  static async addAddress(userId, body) {
    const bodyUpdate = pickObjectKey(body, [
      "fullName",
      "phoneNumber",
      "city",
      "district",
      "ward",
      "street",
      "type",
      "default",
      "codeCity",
      "codeDistrict",
      "codeWard",
    ]);
    if (Object.keys(bodyUpdate).length !== 11) {
      throw new BadRequestError("Bad Request");
    }
    bodyUpdate._id = new Types.ObjectId();
    const user = await userModel.findById(userId);
    if (!user) {
      throw new BadRequestError("Bad Request");
    }
    let listAddress = user.address;
    if (bodyUpdate.default) {
      listAddress = listAddress.map((item) => ({ ...item, default: false }));
    }
    listAddress.push(bodyUpdate);

    const indexDefaultTrue = listAddress.findIndex((item) => item.default);

    if (indexDefaultTrue < 0) {
      listAddress[listAddress.length - 1].default = true;
    }
    user.address = listAddress;
    await user.save({
      validateBeforeSave: false,
    });
    return 1;
  }
  static async getAddress(userId) {
    const user = await findById(userId, {
      address: 1,
    });
    return user.address.sort((a, b) => b.default - a.default);
  }
  static async setAsDefault(userId, id) {
    const user = await userModel.findById(userId);
    if (!user) {
      throw new BadRequestError("Bad Request");
    }

    let listAddress = user.address;

    listAddress = listAddress.map((item) => {
      if (item._id.toString() === id.toString()) {
        return { ...item, default: true };
      }
      return { ...item, default: false };
    });

    user.address = listAddress;
    await user.save({
      validateBeforeSave: false,
    });
    return 1;
  }
  static async deleteAddress(userId, id) {
    const user = await userModel.findById(userId);
    if (!user) {
      throw new BadRequestError("Bad Request");
    }

    let listAddress = user.address;
    const index = listAddress.findIndex(
      (item) => item._id.toString() === id.toString()
    );

    if (index < 0) return;

    const itemDelete = listAddress.splice(index, 1);

    if (itemDelete[0].default && listAddress.length !== 0) {
      listAddress[0].default = true;
    }
    user.address = listAddress;
    await user.save({
      validateBeforeSave: false,
    });
    return 1;
  }
  static async updateAddress({ userId, addressId, body }) {
    const bodyUpdate = pickObjectKey(body, [
      "fullName",
      "phoneNumber",
      "city",
      "district",
      "ward",
      "street",
      "type",
      "default",
      "codeCity",
      "codeDistrict",
      "codeWard",
    ]);
    if (Object.keys(bodyUpdate).length !== 11) {
      throw new BadRequestError("Bad Request");
    }
    const user = await userModel.findById(userId);
    if (!user) {
      throw new BadRequestError("Bad Request");
    }

    let listAddress = user.address;

    const index = listAddress.findIndex(
      (item) => item._id.toString() === addressId.toString()
    );

    if (index < 0) return;

    if (bodyUpdate.default) {
      listAddress = listAddress.map((item) => ({ ...item, default: false }));
    }

    listAddress[index] = { ...bodyUpdate, _id: addressId };

    user.address = listAddress;
    await user.save({
      validateBeforeSave: false,
    });
    return 1;
  }
  static async followShop(userId, { shopId }) {
    await Promise.all([
      findByIdAndUpdate(userId, {
        $addToSet: {
          following: shopId.toString(),
        },
      }),
      updateShop(shopId, {
        $addToSet: {
          shop_followers: new Types.ObjectId(userId),
        },
      }),
    ]);
    return 1;
  }
  static async unFollowShop(userId, { shopId }) {
    await Promise.all([
      findByIdAndUpdate(userId, {
        $pull: {
          following: shopId.toString(),
        },
      }),
      updateShop(shopId, {
        $pull: {
          shop_followers: new Types.ObjectId(userId),
        },
      }),
    ]);
    return 1;
  }
  static async checkAdmin(isAdmin, id) {
    if (!isAdmin) throw new ForbiddenError("permission denied");
    return {
      id,
    };
  }
}

module.exports = UserService;
