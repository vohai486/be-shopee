const keytokenModel = require("../models/keytoken.model");
const { Types } = require("mongoose");
const {
  findCartByUserId,
  findCartAndUpdate,
} = require("../models/repositories/cart.repo");
const { NotFoundRequestError } = require("../core/error.response");
const { findProductById } = require("../models/repositories/product.repo");
const { STATUS } = require("../constants/status");
const cartModel = require("../models/cart.model");
class CartService {
  static addToCart = async (userId, product = {}) => {
    const { productId, quantity } = product;

    const [foundCart, foundProduct] = await Promise.all([
      findCartByUserId(userId),
      findProductById(productId),
    ]);
    if (!foundCart) throw new NotFoundRequestError("Cart Not found");
    if (!foundProduct) throw new NotFoundRequestError("product not found");
    const indexProduct = foundCart.cart_products.findIndex(
      (item) => item.product.toString() === foundProduct._id.toString()
    );

    if (indexProduct < 0) {
      const newCart = await findCartAndUpdate(
        {
          _id: foundCart._id,
          cart_sate: STATUS.ACTIVE,
        },
        {
          $addToSet: {
            cart_products: {
              product: productId,
              quantity,
              shop: foundProduct.product_shop._id,
            },
          },
        }
      );

      return newCart.modifiedCount ? 1 : 0;
    }
    const newCart = await findCartAndUpdate(
      {
        _id: foundCart._id,
        cart_sate: STATUS.ACTIVE,
        "cart_products.product": productId,
        "cart_products.shop": foundProduct.product_shop._id,
      },
      {
        $inc: {
          "cart_products.$.quantity": quantity,
        },
      }
    );
    return newCart ? 1 : 0;
  };
  static updateUserCartQuantity = async (userId, product = {}) => {
    const { productId, quantity } = product;

    const [foundCart, foundProduct] = await Promise.all([
      findCartByUserId(userId),
      findProductById(productId),
    ]);
    if (!foundCart) throw new NotFoundRequestError("Cart Not found");
    if (!foundProduct) throw new NotFoundRequestError("product not found");
    const newCart = await findCartAndUpdate(
      {
        _id: foundCart._id,
        cart_sate: STATUS.ACTIVE,
        "cart_products.product": productId,
      },
      {
        $set: {
          "cart_products.$.quantity": quantity,
        },
      }
    );
    return newCart ? 1 : 0;
  };
  static deleteItemCart = async (userId, { productIds }) => {
    const foundCart = await findCartByUserId(userId);
    if (!foundCart) throw new NotFoundRequestError("Cart Not found");
    let newProductIds = productIds.map((s) => new Types.ObjectId(s));
    const newCart = await findCartAndUpdate(
      {
        _id: foundCart._id,
        cart_sate: STATUS.ACTIVE,
      },
      {
        $pull: {
          cart_products: {
            product: {
              $in: newProductIds,
            },
          },
        },
      }
    );
    return newCart ? 1 : 0;
  };
  static async getListUserCart(userId) {
    return await cartModel
      .findOne({ cart_user: userId })
      .populate(
        "cart_products.product",
        "product_name product_price product_thumb product_quantity"
      )
      .populate("cart_products.shop", "shop_name _id")
      .select("cart_products")
      .sort({
        "cart_products.shop.shop_name": 1,
      })
      .lean();
  }
}

module.exports = CartService;
