const express = require("express");
const { getAllUsers, assignRoleManually } = require("../controllers/roleController");

const router = express.Router();

router.get("/users", getAllUsers);
router.post("/assign-role", assignRoleManually);

module.exports = router;
