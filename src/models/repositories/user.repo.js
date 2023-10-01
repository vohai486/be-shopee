const { ROLE_USER } = require("../../constants/role.user");
const userModel = require("../user.model");

exports.findByEmail = async (
  email,
  select = {
    email: 1,
    fullName: 1,
    password: 1,
    _id: 1,
    active: 1,
  }
) => {
  return await userModel.findOne({ email }).select(select).lean();
};
exports.findById = async (
  id,
  select = {
    fullName: 1,
    phoneNumber: 1,
    email: 1,
    _id: 1,
    avatar: 1,
    gender: 1,
    date_of_birth: 1,
  }
) => {
  return await userModel.findById(id).select(select).lean();
};

exports.findByIdAndUpdate = async (id, body) => {
  return await userModel.findByIdAndUpdate(id, body, { new: true });
};

exports.isAdmin = async (
  id,
  select = {
    role: 1,
  }
) => {
  const user = await userModel.findById(id).select(select).lean();
  return (
    user.role.includes(ROLE_USER.ADMIN) || user.role.includes(ROLE_USER.ROOT)
  );
};
