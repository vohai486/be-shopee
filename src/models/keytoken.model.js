const { model, Schema } = require("mongoose");

const DOCUMENT_NAME = "Key";
const COLLECTION_NAME = "Keys";

const keyTokenSchema = new Schema(
  {
    key_user: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    key_publicKey: { type: String, required: true },
    key_privateKey: { type: String, required: true },
    key_refreshTokenUsed: { type: Array, default: [] }, // RefreshToken da su dung
    key_refreshToken: { type: String, required: true },
  },
  {
    collection: COLLECTION_NAME,
    timestamps: true,
  }
);

module.exports = model(DOCUMENT_NAME, keyTokenSchema);
