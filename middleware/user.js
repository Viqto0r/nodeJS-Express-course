const User = require('../models/user')

module.exports = async (req, res, next) => {
  if (!req.session.user) {
    return next()
  }

  try {
    req.user = await User.findById(req.session.user._id)
    next()
  } catch (e) {
    console.log(e)
  }
}
