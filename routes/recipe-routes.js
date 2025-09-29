
const express = require('express');
const router = express.Router();
const recipeCont = require('../controllers/recipe-controller');
const {SID} = require('../config/constants')

// LIST
router.get(`/recipes-${SID}`, recipeCont.list);

// NEW RECIPE
router.get(`/add-recipe-${SID}`, recipeCont.newForm);
router.post(`/add-recipe-${SID}`, recipeCont.create);

// VIEW
router.get(`/recipe/:recipeId-${SID}`, recipeCont.view);

// DELETE
router.post(`/recipe/delete-${SID}`, recipeCont.remove);

// EDIT
router.get(`/recipe/edit-${SID}/:recipeId`, recipeCont.editForm);
router.post(`/recipe/edit-${SID}/:recipeId`, recipeCont.update);

module.exports = router;
