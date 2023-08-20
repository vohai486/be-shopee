const inventoryModel = require("../inventory.model");

exports.insertInventory = async ({
  inven_productId,
  inven_location = "",
  inven_stock,
  inven_shopId,
}) => {
  return await inventoryModel.create({
    inven_productId,
    inven_location,
    inven_stock,
    inven_shopId,
  });
};
exports.reservationInventory = async ({
  inven_productId,
  quantity,
  cartId,
}) => {
  const newInventory = await inventoryModel.updateOne(
    {
      inven_productId,
      inven_stock: {
        $gte: quantity,
      },
    },
    {
      $inc: {
        inven_stock: -quantity,
      },
      $push: {
        inven_reservations: {
          quantity,
          cartId,
          createOn: new Date(),
        },
      },
    },
    {
      new: true,
    }
  );
  return !!newInventory?.modifiedCount;
};
exports.cancelReservationInventory = async ({
  inven_productId,
  quantity,
  cartId,
}) => {
  const newInventory = await inventoryModel.updateOne(
    {
      inven_productId,
    },
    {
      $inc: {
        inven_stock: quantity,
      },
      $pull: {
        inven_reservations: {
          cartId: cartId.toString(),
        },
      },
    },
    {
      new: true,
    }
  );
  return !!newInventory?.modifiedCount;
};
