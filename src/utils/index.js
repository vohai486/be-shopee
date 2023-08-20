const {
  Types: { ObjectId },
} = require("mongoose");

const fetch = require("node-fetch");
exports.pickObjectKey = (obj, arr) =>
  arr.reduce((acc, item) => (item in obj && (acc[item] = obj[item]), acc), {});

exports.omitObjectKey = (obj, arr) =>
  Object.keys(obj)
    .filter((k) => !arr.includes(k))
    .reduce((acc, key) => ((acc[key] = obj[key]), acc), {});
exports.convertToObjectIdMongo = (id) => new ObjectId(id);
exports.generateFeeShip = async ({
  num,
  codeDistrictShop,
  codeWardUser,
  codeDistrictUser,
}) => {
  if (!codeDistrictShop || !codeDistrictUser || !codeWardUser) return 20000;
  try {
    const res = await fetch(
      "https://online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/available-services",
      {
        method: "post",
        headers: {
          "Content-type": "application/json",
          token: "c65a38bf-b468-11ed-b190-ea4934f9883e",
        },
        body: JSON.stringify({
          from_district: codeDistrictShop,
          shop_id: 3836107,
          to_district: codeDistrictUser,
        }),
      }
    );
    const dataService = await res.json();

    if (dataService?.data && dataService.data?.length === 0) return 30000;
    const serviceId = dataService.data[0].service_id;
    const resFee = await fetch(
      "https://online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/fee",
      {
        method: "post",
        headers: {
          "Content-type": "application/json",
          token: "c65a38bf-b468-11ed-b190-ea4934f9883e",
          ShopId: 3836107,
        },
        body: JSON.stringify({
          from_district_id: codeDistrictShop,
          service_id: serviceId,
          service_type_id: null,
          to_district_id: codeDistrictUser,
          to_ward_code: String(codeWardUser),
          height: 10,
          length: 20,
          weight: 1000 * num,
          width: 12,
          insurance_value: 0,
          coupon: null,
        }),
      }
    );
    const dataFee = await resFee.json();
    return dataFee?.data?.total || 30000;
  } catch (error) {
    return 25000;
  }
};

exports.convertToVietnamTime = (hour) => {
  // 7 là chênh lệch múi giờ giữa UTC+7 và UTC (múi giờ của MongoDB)
  const vietnamHour = (hour + 7) % 24;
  return vietnamHour;
};
