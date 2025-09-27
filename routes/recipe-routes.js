// routes/recipe-routes.js
const express = require('express');
const router = express.Router();
const recipeCont = require('../controllers/recipe-controller');

const SID = '34095756';

// LIST
router.get(`/recipes-${SID}`, recipeCont.list);

// NEW RECIPE
router.get(`/add-recipe-${SID}`, recipeCont.newForm);
router.post(`/add-recipe-${SID}`, recipeCont.create);

// VIEW
router.get(`/recipe/:recipeId-${SID}`, recipeCont.view);

// DELETE
router.post(`/delete-recipe-${SID}`, recipeCont.remove);

module.exports = router;
