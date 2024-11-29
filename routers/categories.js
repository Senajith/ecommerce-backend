const express = require("express");
const router = express.Router();
const Category = require("../models/category");

router.get("/", async (req, res) => {
  const categoryList = await Category.find();
  if (!categoryList) {
    res.status(500).json({ sucess: false });
  }
  res.send(categoryList);
});

router.post("/", async (req, res) => {
  let category = new Category({
    name: req.body.name,
    icon: req.body.icon,
    color: req.body.color,
  });
  category = await category.save();

  if (!category) {
    return res.status(404).send("The Category cannot be created");
  }
  res.send(category);
});

router.get("/:id", async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    res
      .status(500)
      .json({ message: "The category with given ID was not found." });
  }
  res.send(category);
});

router.put("/:id", async (req, res) => {
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      icon: req.body.icon,
      color: req.body.color,
    },
    { new: true }
  );
  if (!category) {
    res
      .status(500)
      .json({ message: "The category with given ID was not found." });
  }
  res.send(category);
});

router.delete("/:id", (req, res) => {
  Category.findOneAndDelete(req.params.id)
    .then((category) => {
      if (category) {
        return res
          .status(200)
          .json({ sucess: true, message: "the category is deleted" });
      } else {
        return res
          .status(404)
          .json({ sucess: false, message: "the category not found" });
      }
    })
    .catch((err) => {
      return res.status(400).json({ sucess: false, error: err });
    });
});

router.get("/get/count", async (req, res) => {
  const categoryCount = await Category.countDocuments();
  if (!categoryCount) {
    res.status(500).json({ success: false });
  }
  res.send({
    categoryCount: categoryCount,
  });
});

module.exports = router;
