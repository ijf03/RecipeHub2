const Recipe = require('../models/recipe');
const { Types } = require('mongoose');

// check for schema, use list if no schema
const MEAL = Recipe.schema.path('mealType')?.enumValues || ['Breakfast','Lunch','Dinner','Snack','Dessert'];
const DIFF = Recipe.schema.path('difficulty')?.enumValues || ['Easy','Medium','Hard'];
const CUI  = Recipe.schema.path('cuisineType')?.enumValues || [
  'Asian','European','American','Chinese','Italian','Indian','French','Japanese',
  'Mexican','Thai','Filipino','Greek','Mediterranean','Fusion','Other'
];

// helpers for unique R-00000 IDs
async function uniqueRecipeId(Model) {
  const count = await Model.countDocuments();
  return `R-${String(count + 1).padStart(5, '0')}`;
}

//GET recipes
exports.list = async (req, res, next) => {
  try {
    const filters = {
      q: (req.query.q || '').trim(),
      meal: req.query.meal || '',
      cuisine: req.query.cuisine || '',
      difficulty: req.query.difficulty || ''
    };

    const find = {};
    if (filters.q) {
      const rx = new RegExp(filters.q, 'i');
      find.$or = [
        { title: rx },
        { chef: rx },
        { ingredients: rx },      // works if ingredients saved as strings
      ];
    }
    if (filters.meal)       find.mealType    = filters.meal;
    if (filters.cuisine)    find.cuisineType = filters.cuisine;
    if (filters.difficulty) find.difficulty  = filters.difficulty;

    const recipes = await Recipe.find(find).sort({ createdDate: 1 }).lean();

    res.render('recipes/recipe_list', {
      pageTitle: 'Recipes',
      SID: req.app.locals.SID,
      recipes,
      filters,
      mealTypes: MEAL,
      cuisines: CUI,
      difficulties: DIFF
    });
  } catch (err) { next(err); }
};

// GET new recipe form
exports.newForm = (req, res) => {
  res.render('recipes/recipe_new', {
    pageTitle: 'Add New Recipe',
    SID: req.app.locals.SID,
    form: {},
    mealTypes: MEAL,
    cuisines: CUI,
    difficulties: DIFF,
    error: null
  });
};

// Convert textarea to array
const toLines = (s) => String(s || '')
  .split(/[\r\n,]+/)
  .map(x => x.trim())
  .filter(Boolean);

// POST new recipe
exports.create = async (req, res, next) => {
  try {
    const f = req.body;
    const doc = {
      recipeId: await uniqueRecipeId(Recipe),
      userId: req.body.userId || 'U-00001',
      title: f.title,
      chef: f.chef,
      mealType: f.mealType,
      cuisineType: f.cuisineType,
      prepTime: Number(f.prepTime),
      difficulty: f.difficulty,
      servings: Number(f.servings),
      ingredients: toLines(f.ingredients),
      instructions: toLines(f.instructions),
      createdDate: new Date().toISOString().slice(0, 10)
    };

    await Recipe.create(doc);
    res.redirect(`/recipes-${req.app.locals.SID}`);
  } catch (err) {
    res.status(400).render('recipes/recipe_new', {
      pageTitle: 'Add New Recipe',
      SID: req.app.locals.SID,
      form: req.body,
      mealTypes: MEAL,
      cuisines: CUI,
      difficulties: DIFF,
      error: err.message
    });
  }
};

//GET recipe by id
exports.view = async (req, res, next) => {
  try {
    const id = req.params.recipeId;
    const or = [{ recipeId: id }];
    if (Types.ObjectId.isValid(id)) or.push({ _id: id });

    const recipe = await Recipe.findOne({ $or: or }).lean();
    if (!recipe) {
      return res.status(404).render('errors/404', {
        pageTitle: 'Not Found',
        url: req.originalUrl
      });
    }

    res.render('recipes/recipe_view', {
      pageTitle: recipe.title,
      SID: req.app.locals.SID,
      recipe
    });
  } catch (err) { next(err); }
};

// POST delete recipe by id
exports.remove = async (req, res, next) => {
  try {
    const id = req.body.recipeId;
    await Recipe.deleteOne({ $or: [{ recipeId: id }, { _id: id }] });
    res.redirect(`/recipes-${req.app.locals.SID}`);
  } catch (err) { next(err); }
};
