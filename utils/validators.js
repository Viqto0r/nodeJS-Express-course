const { body } = require('express-validator/check')
const User = require('../models/user')
const bcrypt = require('bcryptjs')

exports.registerValidators = [
  body('email', 'Введите корректный email')
    .isEmail()
    .custom(async (value) => {
      try {
        const candidate = await User.findOne({ email: value })

        if (candidate) {
          return Promise.reject('Пользователь с таким email уже существует')
        }
      } catch (e) {
        console.log(e)
      }
    })
    .normalizeEmail(),
  body('password', 'Пароль должен быть минимум 6 символов')
    .isLength({ min: 6, max: 56 })
    .isAlphanumeric()
    .trim(),
  body('confirm')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Пароли должны совпадать')
      }

      return true
    })
    .trim(),
  body('name', 'Имя должно быть минимум 3 символа').isLength({ min: 3 }).trim(),
]

exports.loginValidators = [
  body('email', 'Введите корректный email').isEmail().normalizeEmail(),
  body('password', 'Пароль должен быть минимум 6 символов')
    .isLength({ min: 6, max: 56 })
    .isAlphanumeric()
    .trim()
    .custom(async (value, { req }) => {
      try {
        const candidate = await User.findOne({ email: req.body.email })

        if (!candidate) {
          return Promise.reject('Пользователь с таким email не найден')
        }

        const areSame = await bcrypt.compare(value, candidate.password)

        if (!areSame) {
          return Promise.reject('Неверный пароль')
        }
      } catch (e) {
        console.log(e)
      }
    }),
]

exports.courseValidators = [
  body('title', 'Минимальная длина названия 3 символа')
    .isLength({ min: 3 })
    .trim(),
  body('price', 'Введите корректную цену').isNumeric(),
  body('img', 'Введите корректный URL картинки').isURL(),
]
