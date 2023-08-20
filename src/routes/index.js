const router = require("express").Router();

router.use("/shop", require("./shop"));
router.use("/user", require("./user"));
router.use("/category", require("./category"));
router.use("/product", require("./product"));
router.use("/cart", require("./cart"));
router.use("/voucher", require("./voucher"));
router.use("/checkout", require("./checkout"));
router.use("/inventory", require("./inventory"));
router.use("/stats", require("./statistics"));
router.use("/review", require("./review"));
router.use("/message", require("./message"));
router.use("/conversation", require("./conversation"));
router.use("/notification", require("./notification"));
router.use("/", require("./access"));

module.exports = router;
