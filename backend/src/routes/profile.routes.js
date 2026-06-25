const express = require("express");
const profileController = require("../controllers/profile.controller");

const router = express.Router();

router.get("/:handle", profileController.getProfile);
router.post("/:handle/refresh", profileController.refreshProfile);

module.exports = router;
