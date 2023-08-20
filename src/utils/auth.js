var jwt = require("jsonwebtoken");
exports.createTokenPair = async (payload, privateKey, publicKey) => {
  try {
    const accessToken = await jwt.sign(payload, publicKey, {
      expiresIn: "2 days",
    });
    const refreshToken = await jwt.sign(payload, privateKey, {
      expiresIn: "7 days",
    });

    return { accessToken, refreshToken };
  } catch (error) {}
};

exports.verifyToken = async (token, keySecret) => {
  return await jwt.verify(token, keySecret);
};
