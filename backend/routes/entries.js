const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { validateEntry } = require("../middleware/validateEntry");
const controller = require("../controllers/entriesController");

const router = express.Router();
router.use(requireAuth);
router.get("/dashboard", controller.dashboard);
router.get("/by-date/:date", controller.getEntryByDate);
router.get("/", controller.listEntries);
router.post("/", validateEntry, controller.createEntry);
router.get("/:id", controller.getEntry);
router.put("/:id", validateEntry, controller.updateEntry);
router.delete("/:id", controller.deleteEntry);

module.exports = router;