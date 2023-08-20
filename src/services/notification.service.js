const { STATUS_NOTIFICATION } = require("../constants/status");
const notificationModel = require("../models/notifycation.model");
const { convertToObjectIdMongo } = require("../utils");
const pushNotiToSystem = async ({
  type = "SHOP-001",
  senderId = "",
  receivedId = "",
  options = {},
}) => {
  let noti_content;
  if (type === STATUS_NOTIFICATION.ORDER_SUCCESSFULLY) {
    noti_content = senderId
      ? `Đơn hàng của bạn đã được tạo thành công và đang chờ xử lý`
      : `Đơn hàng ${options.orderId} đang chờ xử lý`;
  } else if (type === STATUS_NOTIFICATION.ORDER_CONFIRMED) {
    noti_content = `Đơn hàng ${options.orderId} đã được bởi shop`;
  } else if (type === STATUS_NOTIFICATION.ORDER_SHIPPED) {
    noti_content = `Đơn hàng ${options.orderId} đang được vận chuyển`;
  } else if (type === STATUS_NOTIFICATION.ORDER_DELIVERED) {
    noti_content = `Đơn hàng ${options.orderId} đã được giao thành công`;
  } else if (type === STATUS_NOTIFICATION.ORDER_CANCELLED) {
    noti_content = senderId
      ? `Đơn hàng ${options.orderId} đã bị shop hủy`
      : `Đơn hàng ${options.orderId} đã bị người dùng hủy`;
  }

  const newNoti = await notificationModel.create({
    noti_type: type,
    noti_content,
    noti_senderId: senderId,
    noti_receivedId: receivedId,
    noti_options: options,
  });
  return newNoti;
};
const listNotiByUser = async (userId) => {
  return await notificationModel
    .find({
      noti_receivedId: convertToObjectIdMongo(userId),
      noti_senderId: { $ne: null },
    })
    .sort({ createdAt: -1 })
    .select({
      noti_content: 1,
      _id: 1,
      noti_isRead: 1,
      noti_options: 1,
    });
};
const listNotiByShop = async (userId) => {
  return await notificationModel
    .find({
      noti_receivedId: convertToObjectIdMongo(userId),
      noti_senderId: null,
    })
    .sort({ createdAt: -1 })
    .select({
      noti_content: 1,
      _id: 1,
      noti_isRead: 1,
      noti_options: 1,
    });
};
const markReadAllNoti = async (userId, notifyId) => {
  await notificationModel.updateMany(
    {
      noti_receivedId: convertToObjectIdMongo(userId),
      noti_isRead: false,
    },
    {
      noti_isRead: true,
    }
  );
  return 1;
};
const markReadNoti = async (userId, notifyId) => {
  const newNoti = await notificationModel.findOneAndUpdate(
    {
      _id: notifyId,
      noti_receivedId: convertToObjectIdMongo(userId),
      noti_isRead: false,
    },
    {
      noti_isRead: true,
    }
  );
  return newNoti?.isModified("noti_isRead") ? 1 : 0;
};
module.exports = {
  pushNotiToSystem,
  markReadAllNoti,
  markReadNoti,
  listNotiByUser,
  listNotiByShop,
  markReadNoti,
};
