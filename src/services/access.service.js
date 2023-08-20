const { ROLE_USER } = require("../constants/role.user");
const {
  BadRequestError,
  AuthFailureError,
  ForbiddenError,
  NotFoundRequestError,
} = require("../core/error.response");
const { findByEmail } = require("../models/repositories/user.repo");
const userModel = require("../models/user.model");
const crypto = require("crypto");
const { pickObjectKey } = require("../utils");
const KeyTokenService = require("./keytoken.service");
const bcrypt = require("bcrypt");
const { createTokenPair } = require("../utils/auth");
const cartModel = require("../models/cart.model");

class AccessService {
  static async signUp({
    firstName,
    lastName,
    password,
    passwordConfirm,
    email,
  }) {
    const foundUser = await findByEmail(email);
    if (foundUser) throw new BadRequestError("Người dùng đã tồn tại");

    const user = await userModel.create({
      firstName,
      lastName,
      password,
      passwordConfirm,
      email,
      role: [ROLE_USER.USER],
    });
    if (user) {
      const privateKey = crypto.randomBytes(64).toString("hex");
      const publicKey = crypto.randomBytes(64).toString("hex");
      const [keyStore, cart] = await Promise.all([
        KeyTokenService.createKeyToken({
          userId: user._id,
          publicKey: publicKey,
          privateKey: privateKey,
        }),
        cartModel.create({ cart_user: user._id }),
      ]);
      if (!keyStore) {
        throw new BadRequestError("keyStore error");
      }
      return pickObjectKey(user, ["email", "fullName", "_id"]);
    }
    return null;
  }

  static async login({ email, password, refreshToken = null }) {
    // check email in dbs
    const foundUser = await findByEmail(email);
    if (!foundUser) throw new NotFoundRequestError("Người dùng không tồn tại");

    // match password
    const matchPassword = await bcrypt.compare(password, foundUser.password);
    if (!matchPassword) throw new AuthFailureError("Mật khẩu không chính xác");

    // create accessToken and refreshToken and save
    const privateKey = crypto.randomBytes(64).toString("hex");
    const publicKey = crypto.randomBytes(64).toString("hex");
    const tokens = await createTokenPair(
      {
        userId: foundUser._id,
        email: foundUser.email,
      },
      privateKey,
      publicKey
    );
    await KeyTokenService.createKeyToken({
      userId: foundUser._id,
      refreshToken: tokens.refreshToken,
      publicKey,
      privateKey,
    });

    return {
      user: pickObjectKey(foundUser, ["_id", "email", "fullName"]),
      tokens,
    };
  }

  static async logout(keyStore) {
    const key = await KeyTokenService.removeKeyByUserId(keyStore._id);
    return key ? 1 : 0;
  }

  static async handleRefreshToken({ user, keyStore, refreshToken }) {
    const { userId, email } = user;
    if (
      keyStore.key_refreshTokenUsed.includes(refreshToken) ||
      keyStore.key_refreshToken !== refreshToken
    ) {
      await KeyTokenService.removeKeyByUserId(userId);
      throw new ForbiddenError("Something wrong happend!! Pls relogin");
    }

    // check UserId
    const foundUser = await findByEmail(email);
    if (!foundUser) throw new NotFoundRequestError('Người dùng không tồn tại"');

    // create privateKey, publicKey
    const tokens = await createTokenPair(
      {
        userId: foundUser._id,
        email: foundUser.email,
      },
      keyStore.key_privateKey,
      keyStore.key_publicKey
    );

    // update keyStore
    keyStore.key_refreshToken = tokens.refreshToken;
    keyStore.key_refreshTokenUsed.addToSet(tokens.refreshToken);
    await keyStore.save();
    return {
      user,
      tokens,
    };
  }
}

module.exports = AccessService;
