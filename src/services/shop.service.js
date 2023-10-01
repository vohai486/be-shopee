const { USER } = require("../constants/role.user");
const {
  BadRequestError,
  AuthFailureError,
  ForbiddenError,
  NotFoundRequestError,
} = require("../core/error.response");
const { findByEmail } = require("../models/repositories/user.repo");
const userModel = require("../models/user.model");
const crypto = require("crypto");
const { pickObjectKey, omitObjectKey } = require("../utils");
const KeyTokenService = require("./keytoken.service");
const bcrypt = require("bcrypt");
const { createTokenPair } = require("../utils/auth");
const shopModel = require("../models/shop.model");
const { STATUS } = require("../constants/status");
const { updateShop, findOneShop } = require("../models/repositories/shop.repo");
const productModel = require("../models/product.model");
const ProductService = require("./product.service");
const { Types } = require("mongoose");

class ShopService {
  static async registerSeller(user, { name, address = {} }) {
    const { email, userId } = user;
    const foundUser = await findByEmail(email);
    if (!foundUser) throw new NotFoundRequestError("Người dùng không tồn tại");
    const shop = await shopModel.create({
      shop_name: name,
      _id: userId,
      shop_address: address,
    });
    return {
      shop: pickObjectKey(shop, ["shop_name", "_id"]),
    };
  }

  static async checkShop(userId) {
    const shop = await findOneShop(userId);
    if (!shop) throw new NotFoundRequestError("Shop không tồn tại");
    return { name: shop.shop_name, id: shop._id };
  }

  // Check
  static async getDetailShop(shopId, userId, query) {
    const [shop, resProduct] = await Promise.all([
      findOneShop(shopId, {
        _id: 1,
        shop_name: 1,
        shop_followers: 1,
        shop_ratingsAverage: 1,
        shop_avatar: 1,
        createdAt: 1,
      }),
      ProductService.getAllProduct(
        {
          ...query,
          shopId: shopId,
        },
        {
          _id: 1,
          product_category: 1,
        },
        {
          path: "product_category",
          select: "category_name _id",
        }
      ),
    ]);
    const categories = resProduct.products.reduce((result, product) => {
      if (
        result.findIndex(
          (item) =>
            item._id.toString() === product.product_category._id.toString()
        ) < 0
      ) {
        result.push(product.product_category);
      }
      return result;
    }, []);
    return {
      shop: {
        followers: shop.shop_followers.length || 0,
        rating: shop.shop_ratingsAverage || 0,
        name: shop.shop_name,
        avatar: shop.shop_avatar,
        id: shop._id,
        isFollowing: userId
          ? shop.shop_followers.findIndex((id) => id.toString() === userId) > -1
          : false,
        num_product: resProduct.products.length,
        createdAt: shop.createdAt,
      },
      categories,
    };
  }
  static async getAllShop({ status = "", sortBy = "", page = 1, limit = 10 }) {
    const query = {};
    let sort = {
      createdAt: -1,
    };
    if (status === STATUS.ACTIVE) {
      query.shop_status = STATUS.ACTIVE;
    }
    if (status === STATUS.INACTIVE) {
      query.shop_status = STATUS.INACTIVE;
    }
    if (sortBy === "oldest") {
      sort = {
        createdAt: 1,
      };
    }
    const skip = (+page - 1) * limit;

    const [shopFilter, shops] = await Promise.all([
      shopModel
        .find(query)
        .select({
          shop_name: 1,
          shop_status: 1,
          shop_avatar: 1,
          createdAt: 1,
          _id: 1,
        })
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .lean(),
      shopModel.find(query).lean(),
    ]);
    const total_pages = Math.ceil(shops.length / limit);
    return {
      shops: shopFilter,
      pagination: {
        total_pages,
        page,
        limit,
      },
    };
  }
  static async activeShop({ listId = [] }) {
    let newIds = listId.map((s) => new Types.ObjectId(s));
    await shopModel.updateMany(
      {
        shop_status: STATUS.INACTIVE,
        _id: { $in: newIds },
      },
      {
        shop_status: STATUS.ACTIVE,
      }
    );
    return 1;
  }
  static async inActiveShop({ listId = [] }) {
    let newIds = listId.map((s) => new Types.ObjectId(s));
    await shopModel.updateMany(
      {
        shop_status: STATUS.ACTIVE,
        _id: { $in: newIds },
      },
      {
        shop_status: STATUS.INACTIVE,
      }
    );
    return 1;
  }
}

module.exports = ShopService;
