const { HEADER } = require("../constants/headers");
const { AuthFailureError, ForbiddenError } = require("../core/error.response");
const { isAdmin } = require("../models/repositories/user.repo");
const KeyTokenService = require("../services/keytoken.service");
const asyncHandler = require("../utils/asyncHandler");
const { verifyToken } = require("../utils/auth");

exports.optional = asyncHandler(async (req, res, next) => {
  // Check userId missing
  const userId = req.headers[HEADER.CLIENT_ID];
  if (userId) {
    const keyStore = await KeyTokenService.findByUserId(userId);
    if (req.headers[HEADER.REFRESHTOKEN]) {
      try {
        const refreshToken = req.headers[HEADER.REFRESHTOKEN];
        const decodeUser = await verifyToken(
          refreshToken,
          keyStore.key_privateKey
        );

        if (userId !== decodeUser.userId)
          throw new AuthFailureError("Invalid UserId");

        req.keyStore = keyStore;
        req.user = decodeUser;
        req.refreshToken = refreshToken;
        return next();
      } catch (error) {
        throw error;
      }
    }
    const accessToken = req.headers[HEADER.AUTHORIZATION];
    if (!accessToken) throw new AuthFailureError("Invalid Request");
    try {
      const decodeUser = await verifyToken(accessToken, keyStore.key_publicKey);
      if (decodeUser.userId !== userId)
        throw new AuthFailureError("Invalid UserId");

      req.user = decodeUser;
      req.keyStore = keyStore;
      next();
    } catch (error) {
      throw error;
    }
  } else {
    req.user = {};
    next();
  }

  // verify token
});

exports.authentication = asyncHandler(async (req, res, next) => {
  // Check userId missing
  const userId = req.headers[HEADER.CLIENT_ID];
  if (!userId) throw new AuthFailureError("Invalid Request");

  const keyStore = await KeyTokenService.findByUserId(userId);
  if (!keyStore) throw new AuthFailureError("Not found keyStore");

  if (req.headers[HEADER.REFRESHTOKEN]) {
    try {
      const refreshToken = req.headers[HEADER.REFRESHTOKEN];
      const decodeUser = await verifyToken(
        refreshToken,
        keyStore.key_privateKey
      );

      if (userId !== decodeUser.userId)
        throw new AuthFailureError("Invalid UserId");

      req.keyStore = keyStore;
      req.user = decodeUser;
      req.refreshToken = refreshToken;
      return next();
    } catch (error) {
      throw error;
    }
  }

  // verify token

  const accessToken = req.headers[HEADER.AUTHORIZATION];
  if (!accessToken) throw new AuthFailureError("Invalid Request");

  try {
    const decodeUser = await verifyToken(accessToken, keyStore.key_publicKey);
    if (decodeUser.userId !== userId)
      throw new AuthFailureError("Invalid UserId");

    req.user = decodeUser;
    req.keyStore = keyStore;
    next();
  } catch (error) {
    throw error;
  }
});

exports.isAdmin = asyncHandler(async (req, res, next) => {
  const { userId } = req.user;
  const isCheck = await isAdmin(userId);
  if (!isCheck) throw new ForbiddenError("permission denied");
  req.isAdmin = true;
  return next();
});
