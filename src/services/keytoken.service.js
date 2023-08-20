const keytokenModel = require("../models/keytoken.model");
const { Types } = require("mongoose");

class KeyTokenService {
  static async createKeyToken({ userId, publicKey, privateKey, refreshToken }) {
    try {
      const tokens = await keytokenModel.findOneAndUpdate(
        {
          key_user: userId,
        },
        {
          key_publicKey: publicKey,
          key_privateKey: privateKey,
          key_refreshToken: refreshToken,
          key_refreshTokenUsed: [],
        },
        { upsert: true, new: true }
      );
      return tokens ? tokens.key_publicKey : null;
    } catch (error) {
      return error;
    }
  }
  static findByUserId = async (userId) => {
    return await keytokenModel.findOne({
      key_user: new Types.ObjectId(userId),
    });
  };
  static removeKeyByUserId = async (id) => {
    return await keytokenModel.findByIdAndDelete(id);
  };
}

module.exports = KeyTokenService;
