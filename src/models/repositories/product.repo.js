const productModel = require("../product.model");

exports.updateProduct = async (query, bodyUpdate) => {
  return await productModel.findOneAndUpdate(query, bodyUpdate, {
    new: true,
  });
};

exports.findProduct = async (query, select = {}, limit = 20, page = 1) => {
  const skip = +limit * (+page - 1);
  return await productModel
    .find(query)
    .populate("product_shop", "name email -_id")
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .select(select)
    .lean();
};
exports.searchProductByUser = async (
  keySearch,
  select = {
    _id: 1,
    product_name: 1,
    product_originalPrice: 1,
    product_discount: 1,
    product_quantity_sold: 1,
    product_thumb: 1,
    product_ratingsAverage: 1,
  }
) => {
  const regexSearch = new RegExp(keySearch);
  const results = await productModel
    .find(
      {
        verify: true,
        isPublished: true,
        $text: {
          $search: regexSearch,
        },
      },
      { score: { $meta: "textScore" } }
    )
    .select(select)
    .sort({ score: { $meta: "textScore" } })
    .lean();
  return results;
};
exports.findProductById = async (id) => {
  return await productModel
    .findOne({
      _id: id,
      verify: true,
      isDraft: false,
      isPublished: true,
    })
    .populate(
      "product_shop",
      "shop_name _id shop_followers shop_ratingsAverage shop_avatar"
    )
    .lean();
};
exports.checkProductByServer = async (products) => {
  return await Promise.all(
    products.map(async (product) => {
      const foundProduct = await productModel
        .findById(product.productId)
        .populate("product_shop", "shop_name _id shop_address")
        .select({
          product_name: 1,
          product_price: 1,
          product_thumb: 1,
          product_price: 1,
          product_shop: 1,
          product_quantity: 1,
        })
        .lean();
      if (foundProduct) {
        return {
          price: foundProduct.product_price,
          quantity: product.quantity,
          productId: product.productId,
          shop: foundProduct.product_shop,
          thumb: foundProduct.product_thumb,
          name: foundProduct.product_name,
          countStock: foundProduct.product_quantity,
        };
      }
    })
  );
};
