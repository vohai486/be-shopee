exports.STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
};

exports.STATUS_ORDER = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  SHIPPED: "shipped",
  CANCELLED: "cancelled",
  DELIVERED: "delivered",
};

// ORDER-001: order successfully
// ORDER-002: order faield
// ORDER-003: order confirmed
// ORDER-004: order shipped
// ORDER-005: order cancelled
// ORDER-006: order delivered
// SHOP-001 : new product by User following
exports.STATUS_NOTIFICATION = {
  ORDER_SUCCESSFULLY: "ORDER-001",
  ORDER_FAILED: "ORDER-002",
  ORDER_CONFIRMED: "ORDER-003",
  ORDER_SHIPPED: "ORDER-004",
  ORDER_CANCELLED: "ORDER-005",
  ORDER_DELIVERED: "ORDER-006",
  SHOP_NEW_PRODUCT: "SHOP-001",
};
