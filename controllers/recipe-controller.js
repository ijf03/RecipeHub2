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
async function nextRecipeId() {
  const last = await Recipe.findOne({}, { recipeId: 1 })
    .sort({ recipeId: -1 })
    .lean();

  const lastNum = last ? parseInt(String(last.recipeId).slice(2), 10) : 0;
  return `R-${String(lastNum + 1).padStart(5, '0')}`;
}

function firstError(e) {
    if (!e) return null;
    if (e.code === 11000) {
      const key = Object.keys(e.keyPattern || {})[0] || 'field';
      const val = e.keyValue ? JSON.stringify(e.keyValue) : '';
      return `Duplicate value for ${key}. ${val}`;
    }
    if (e.errors) {
      const k = Object.keys(e.errors)[0];
      return e.errors[k]?.message || 'Validation error.';
    }
    return e.message || 'Validation error.';
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

exports.create = async (req, res, next) => {
  try {
    const f = req.body;

    //title check
    const exists = await Recipe.findOne({ title: new RegExp(`^${f.title}$`, 'i') }).lean();
    if (exists) {
      return res.status(400).render('recipes/recipe_new', {
        pageTitle: 'Add New Recipe',
        SID: req.app.locals.SID,
        form: req.body,
        mealTypes: MEAL,
        cuisines: CUI,
        difficulties: DIFF,
          error: firstError(err)
      });
    }

    // chef
    let chefName = String(f.chef || '').trim();
    if ((f.isMine === 'on' || f.isMine === 'true' || f.isMine === '1') && req.currentUser) {
      chefName = req.currentUser.fullName;
    }

    const doc = {
      recipeId: await nextRecipeId(),
      userId: (req.currentUser && req.currentUser.userId) || req.userIdParam || '',
      title: String(f.title || '').trim(),
      chef: chefName,
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
    res.redirect(`/recipes-${req.app.locals.SID}${req.userIdParam ? ('?userId=' + req.userIdParam) : ''}`);
  } catch (err) {
    console.error('[createRecipe] error', {
      code: err.code,
      keyPattern: err.keyPattern,
      keyValue: err.keyValue,
      message: err.message
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
    const id = req.params.recipeId;
    const or = [{ recipeId: id }];
    if (Types.ObjectId.isValid(id)) {
      or.push({ _id: id });
    }

    await Recipe.deleteOne({ $or: or });
    res.redirect(`/recipes-${req.app.locals.SID}${req.userIdParam ? ('?userId=' + req.userIdParam) : ''}`);
  } catch (err) { next(err); }
};

// GET edit recipe form
exports.editForm = async (req, res, next) => {
  try {
    const id = req.params.recipeId;
    const or = [{ recipeId: id }];
    const recipe = await Recipe.findOne({ $or: or }).lean();
    if (!recipe) {
      return res.status(404).render('errors/404', { pageTitle: 'Not Found', url: req.originalUrl });
    }

    res.render('recipes/recipe_edit', {
      pageTitle: 'Edit Recipe',
      SID: req.app.locals.SID,
      form: recipe,
      mealTypes: MEAL,
      cuisines: CUI,
      difficulties: DIFF,
      error: null
    });
  } catch (err) { next(err); }
};

// POST update
exports.update = async (req, res, next) => {
  try {
    const id = req.params.recipeId;
    const or = [{ recipeId: id }];

    const f = req.body;

    // prevent same title
    const current = await Recipe.findOne({ $or: or }, { _id: 1 }).lean();
    if (!current) {
      return res.status(404).render('errors/404', { pageTitle: 'Not Found', url: req.originalUrl });
    }
    const dup = await Recipe.findOne({
      title: new RegExp(`^${f.title}$`, 'i'),
      _id: { $ne: current._id }
    }).lean();
    if (dup) {
      return res.status(400).render('recipes/recipe_edit', {
        pageTitle: 'Edit Recipe',
        SID: req.app.locals.SID,
        form: { ...f, recipeId: id },
        mealTypes: MEAL,
        cuisines: CUI,
        difficulties: DIFF,
        error: 'A recipe with that title already exists.'
      });
    }

    let chefName = String(f.chef || '').trim();
    if ((f.isMine === 'on' || f.isMine === 'true' || f.isMine === '1') && req.currentUser) {
      chefName = req.currentUser.fullName;
    }

    await Recipe.updateOne({ $or: or }, {
      $set: {
        title: String(f.title || '').trim(),
        chef: chefName,
        mealType: f.mealType,
        cuisineType: f.cuisineType,
        prepTime: Number(f.prepTime),
        difficulty: f.difficulty,
        servings: Number(f.servings),
        ingredients: String(f.ingredients || '')
          .split(/[\r\n,]+/).map(s => s.trim()).filter(Boolean),
        instructions: String(f.instructions || '')
          .split(/[\r\n,]+/).map(s => s.trim()).filter(Boolean),
      }
    }, { runValidators: true });

    res.redirect(`/recipes-${req.app.locals.SID}${req.userIdParam ? ('?userId=' + req.userIdParam + '&') : '?'}msg=Recipe%20updated`);
  } catch (err) {
    res.status(400).render('recipes/recipe_edit', {
      pageTitle: 'Edit Recipe',
      SID: req.app.locals.SID,
      form: { ...req.body, recipeId: req.params.recipeId },
      mealTypes: MEAL,
      cuisines: CUI,
      difficulties: DIFF,
      error: err.message || 'Validation error.'
    });
  }
};