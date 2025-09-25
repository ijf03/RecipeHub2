const User = require('../models/user');

// error
function firstError(err) {
  if (!err) return null;
  if (err.code === 11000) return 'Email or userId must be unique.';
  if (err.errors) {
    const k = Object.keys(err.errors)[0];
    return err.errors[k]?.message || 'Validation error.';
  }
  return err.message || 'Validation error.';
}

// GET users
exports.list = async (req, res) => {
  try {
    const users = await User.find().lean();
    res.render('users/list', {
      pageTitle: 'Users',
      users
    });
  } catch (err) {
    res.status(500).render('errors/404', { pageTitle: 'Error', url: req.originalUrl });
  }
};

//  add new user
exports.newForm = (req, res) => {
  res.render('users/new', {
    pageTitle: 'Add User',
    form: {},
    error: null
  });
};

// POST new user
exports.create = async (req, res) => {
  const SID = req.app.locals.SID;
  try {
    const { fullName, email, phone, role } = req.body;

    const userId = makeId('U');
    const doc = new User({
      userId,
      fullName: String(fullName || '').trim(),
      email: String(email || '').trim().toLowerCase(),
      phone: String(phone || '').trim(),
      role: role || 'manager',
    });

    await doc.save();
    res.redirect(`/users/view-${SID}/${doc.userId}`);
  } catch (err) {
    res.status(400).render('users/new', {
      pageTitle: 'Add User',
      form: req.body,
      error: firstError(err)
    });
  }
};

// GET user Id
exports.view = async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.userId }).lean();
    if (!user) return res.status(404).render('errors/404', { pageTitle: 'Not Found', url: req.originalUrl });

    res.render('users/view', {
      pageTitle: user.fullName,
      user
    });
  } catch (err) {
    res.status(500).render('errors/404', { pageTitle: 'Error', url: req.originalUrl });
  }
};

// GET eit user
exports.editForm = async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.userId }).lean();
    if (!user) return res.status(404).render('errors/404', { pageTitle: 'Not Found', url: req.originalUrl });

    res.render('users/edit', {
      pageTitle: `Edit ${user.fullName}`,
      form: user,
      error: null
    });
  } catch (err) {
    res.status(500).render('errors/404', { pageTitle: 'Error', url: req.originalUrl });
  }
};

// update user
exports.update = async (req, res) => {
  const SID = req.app.locals.SID;
  try {
    const { fullName, email, phone, role } = req.body;

    const update = {
      fullName: String(fullName || '').trim(),
      email: String(email || '').trim().toLowerCase(),
      phone: String(phone || '').trim(),
      role: role || 'manager'
    };

    const user = await User.findOneAndUpdate(
      { userId: req.params.userId },
      update,
      { new: true, runValidators: true }
    );

    if (!user) return res.status(404).render('errors/404', { pageTitle: 'Not Found', url: req.originalUrl });

    res.redirect(`/users/view-${SID}/${user.userId}`);
  } catch (err) {
    res.status(400).render('users/edit', {
      pageTitle: 'Edit User',
      form: { ...req.body, userId: req.params.userId },
      error: firstError(err)
    });
  }
};

// delete user
exports.remove = async (req, res) => {
  const SID = req.app.locals.SID;
  try {
    const result = await User.deleteOne({ userId: req.params.userId });
    if (result.deletedCount === 0) {
      return res.status(404).render('errors/404', { pageTitle: 'Not Found', url: req.originalUrl });
    }
    res.redirect(`/users/list-${SID}`);
  } catch (err) {
    res.status(500).render('errors/404', { pageTitle: 'Error', url: req.originalUrl });
  }
};

//ID generator (U-xxxxx)
function makeId(prefix) {
  return `${prefix}-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;
}
