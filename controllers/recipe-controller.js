const Recipe = require('../models/recipe');

exports.list = async (req, res) => {
  const recipes = await Recipe.find().lean();
  res.render('recipes/list', { pageTitle: 'Recipes', recipes });
};

exports.create = async (req, res) => {
  await Recipe.create(req.body);
  res.redirect(`/recipes/list-${req.app.locals.SID}`);
};
