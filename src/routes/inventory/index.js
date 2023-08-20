const express = require("express");
const { authentication, isAdmin } = require("../../middlewares/auth");
const inventoryController = require("../../controllers/inventory.controller");

const router = express.Router();

// authentication //
router.use(authentication);
router.get("/", inventoryController.manageInventory);
router.post("/import", inventoryController.importProduct);

router.use(isAdmin);

module.exports = router;
