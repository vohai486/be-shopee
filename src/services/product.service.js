const { Types } = require("mongoose");
const { USER } = require("../constants/role.user");
const {
  BadRequestError,
  AuthFailureError,
  ForbiddenError,
  NotFoundRequestError,
} = require("../core/error.response");
const productModel = require("../models/product.model");
const { insertImport } = require("../models/repositories/import.repo");
const { insertInventory } = require("../models/repositories/inventory.repo");
const {
  updateProduct,
  findProduct,
  findProductById,
  searchProductByUser,
} = require("../models/repositories/product.repo");
const { findOneShop } = require("../models/repositories/shop.repo");
const { omitObjectKey } = require("../utils");
const { uploadProduct } = require("../utils/upload");
const { findById } = require("../models/repositories/user.repo");

class ProductService {
  static async createProduct(req, shopId) {
    const {
      product_name,
      product_description,
      product_originalPrice,
      product_importPrice,
      product_discount,
      product_quantity,
      product_category,
      product_specifications,
      product_brand,
      product_size,
    } = req.body;
    const foundShop = await findOneShop(shopId);
    if (!foundShop) throw new NotFoundRequestError("Shop không tồn tại");
    const url = await uploadProduct(req);
    const specifications = JSON.parse(product_specifications);
    const product = await productModel.create({
      product_thumb: url,
      product_name,
      product_description,
      product_originalPrice,
      product_discount,
      product_quantity,
      product_category,
      product_shop: shopId,
      product_specifications: specifications,
      product_brand,
      product_size,
    });
    if (product) {
      await Promise.all([
        insertInventory({
          inven_productId: product._id,
          inven_stock: product.product_quantity || 0,
          inven_shopId: shopId,
        }),
        insertImport({
          import_productId: product._id,
          import_shopId: shopId,
          import_quantity: product_quantity || 0,
          import_purchase: product_importPrice || 0,
        }),
      ]);
    }
    return product ? 1 : 0;
  }

  static async verifyProduct({ productIds }) {
    let newProductIds = productIds.map((s) => new Types.ObjectId(s));
    const newProducts = await productModel.updateMany(
      {
        _id: { $in: newProductIds },
      },
      {
        verify: true,
      }
    );
    return newProducts?.modifiedCount === productIds.length ? 1 : 0;
  }

  static async publishProductByShop({ product_shop, body: { productIds } }) {
    const foundShop = await findOneShop(product_shop);
    if (!foundShop) throw new NotFoundRequestError("Shop không tồn tại");
    let newProductIds = productIds.map((s) => new Types.ObjectId(s));
    const product = await productModel.updateMany(
      {
        _id: { $in: newProductIds },
        product_shop: product_shop,
      },
      {
        isDraft: false,
        isPublished: true,
      }
    );
    return product.modifiedCount ? 1 : 0;
  }
  static async unPublishProductByShop({ product_shop, body: { productIds } }) {
    const foundShop = await findOneShop(product_shop);
    if (!foundShop) throw new NotFoundRequestError("Shop không tồn tại");
    let newProductIds = productIds.map((s) => new Types.ObjectId(s));
    const product = await productModel.updateMany(
      {
        _id: { $in: newProductIds },
        product_shop: product_shop,
      },
      {
        isDraft: true,
        isPublished: false,
      }
    );
    return product.modifiedCount ? 1 : 0;
  }

  static async getAllProduct(
    query,
    select = {
      _id: 1,
      product_name: 1,
      product_originalPrice: 1,
      product_discount: 1,
      product_price: 1,
      product_quantity_sold: 1,
      product_thumb: 1,
      product_ratingsAverage: 1,
    },
    populate = ""
  ) {
    const {
      page = 1,
      limit = 10,
      sortBy = "ctime",
      category,
      ratingFilter,
      minPrice,
      maxPrice,
      order = "",
      shopId = "",
      keyword = "",
    } = query;
    const skip = (+page - 1) * limit;
    const queryFilter = { isPublished: true, verify: true };
    if (category) {
      queryFilter.product_category = new Types.ObjectId(category);
    }
    if (shopId) {
      queryFilter.product_shop = new Types.ObjectId(shopId);
    }
    if (ratingFilter) {
      queryFilter.product_ratingsAverage = {
        $gte: +ratingFilter === 5 ? 4.7 : +ratingFilter,
      };
    }

    if (minPrice) {
      queryFilter.product_price = {
        $gte: +minPrice,
      };
    }
    if (maxPrice) {
      queryFilter.product_price = {
        $lte: +maxPrice,
      };
    }
    const findScore = {};
    if (keyword) {
      const regexSearch = new RegExp(keyword.replace(/%/g, " "));
      queryFilter["$text"] = { $search: regexSearch };
      findScore.score = { $meta: "textScore" };
    }

    const sortFilter =
      sortBy === "pop"
        ? { product_ratingsAverage: -1 }
        : sortBy === "ctime"
        ? { updatedAt: -1 }
        : sortBy === "sales"
        ? { product_quantity_sold: -1 }
        : sortBy === "price" && order === "asc"
        ? { product_price: 1 }
        : { product_price: -1 };

    const [productFilter, products] = await Promise.all([
      productModel
        .find(queryFilter, findScore)
        .populate(populate)
        .sort(sortFilter)
        .skip(skip)
        .limit(limit)
        .select(select)
        .lean(),
      productModel.find(queryFilter).select(select).lean(),
    ]);
    const total_pages = Math.ceil(products.length / limit);
    return {
      products: productFilter,
      pagination: {
        total_pages,
        page,
        limit,
      },
    };
  }
  static async findProduct(id) {
    const product = await findProductById(id);
    product.product_shop.shop_followers =
      product.product_shop.shop_followers?.length || 0;
    return product;
  }
  static async getListSearchProduct(keySearch) {
    return await searchProductByUser(keySearch);
  }
  static async getAllProductForShop(shopId, { type, page = 1, limit = 10 }) {
    const query = { product_shop: shopId };
    if (type === "published") {
      query.isPublished = true;
      query.verify = true;
    }
    if (type === "out-stock") {
      query.product_quantity = 0;
    }
    if (type === "wait-vefify") {
      query.verify = false;
    }
    if (type === "draft") {
      query.isDraft = true;
      query.verify = true;
    }
    const skip = (+page - 1) * limit;

    const [productFilter, products] = await Promise.all([
      productModel
        .find(query)
        .populate("product_category", "category_name _id")
        .skip(skip)
        .limit(limit)
        .lean(),
      productModel.find(query).lean(),
    ]);
    const total_pages = Math.ceil(products.length / limit);
    return {
      products: productFilter,
      pagination: {
        total_pages,
        page,
        limit,
      },
    };
  }
  static async getAllProductForAdmin({ status, page = 1, limit = 10 }) {
    const query = {};
    if (status === "wait-verify") {
      query.verify = false;
    }
    if (status === "verify") {
      query.verify = true;
    }

    const skip = (+page - 1) * limit;

    const [productFilter, products] = await Promise.all([
      productModel
        .find(query)
        .select({
          product_thumb: 1,
          product_name: 1,
          createdAt: 1,
          _id: 1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),
      productModel.find(query).lean(),
    ]);
    const total_pages = Math.ceil(products.length / limit);
    return {
      products: productFilter,
      pagination: {
        total_pages,
        page,
        limit,
      },
    };
  }
}

module.exports = ProductService;
