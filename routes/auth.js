const { Router } = require('express')
const User = require('../models/user')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const nodemailer = require('nodemailer')
const { validationResult } = require('express-validator/check')
const { NODEMAILER_USER, NODEMAILER_PASS } = require('../keys')

const { registerValidators, loginValidators } = require('../utils/validators')

const regEmail = require('../emails/registration')
const resetEmail = require('../emails/reset')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: NODEMAILER_USER,
    pass: NODEMAILER_PASS,
  },
})

const router = Router()

router.get('/login', async (req, res) => {
  res.render('auth/login', {
    title: 'Авторизация',
    isLogin: true,
    loginError: req.flash('login-error'),
    registerError: req.flash('register-error'),
  })
})

router.get('/logout', async (req, res) => {
  req.session.destroy(() => {
    res.redirect('/auth/login')
  })
})

router.post('/login', loginValidators, async (req, res) => {
  try {
    const { email } = req.body
    const candidate = await User.findOne({ email })

    const errors = validationResult(req)

    if (!errors.isEmpty()) {
      req.flash('login-error', errors.array()[0].msg)
      return res.redirect('/auth/login')
    }

    req.session.user = candidate
    req.session.isAuthenticated = true
    req.session.save((err) => {
      if (err) {
        throw err
      }

      res.redirect('/')
    })
  } catch (e) {
    console.log(e)
  }
})

router.post('/register', registerValidators, async (req, res) => {
  try {
    const { email, password, name } = req.body

    const errors = validationResult(req)

    if (!errors.isEmpty()) {
      req.flash('register-error', errors.array()[0].msg)

      return res.status(422).redirect('/auth/login#register')
    }

    const hashPassword = await bcrypt.hash(password, 10)

    const user = new User({
      email,
      name,
      password: hashPassword,
      cart: { items: [] },
    })

    await user.save()

    res.redirect('/auth/login')
    await transporter.sendMail(regEmail(email))
  } catch (e) {
    console.log(e)
  }
})

router.get('/reset', (req, res) => {
  res.render('auth/reset', {
    title: 'Забыли пароль?',
    error: req.flash('error'),
  })
})

router.post('/reset', (req, res) => {
  try {
    crypto.randomBytes(32, async (err, buffer) => {
      if (err) {
        req.flash('error', 'Что-то пошло не так, повторите попытку позже')
        return res.redirect('/auth/reset')
      }

      const token = buffer.toString('hex')

      const candidate = await User.findOne({ email: req.body.email })

      if (!candidate) {
        req.flash('error', 'Такой email не зарегистрирован')
        return res.redirect('/auth/reset')
      }

      candidate.resetToken = token
      candidate.resetTokenExp = Date.now() + 60 * 60 * 1000
      await candidate.save()

      transporter.sendMail(resetEmail(candidate.email, token))

      res.redirect('/auth/login')
    })
  } catch (e) {
    console.log(e)
  }
})

router.get('/password/:token', async (req, res) => {
  const { token } = req.params
  if (!token) {
    return res.redirect('/auth/login')
  }

  try {
    const user = await User.findOne({
      resetToken: token,
      resetTokenExp: { $gt: Date.now() },
    })

    if (!user) {
      return res.redirect('/auth/login')
    }

    res.render('auth/password', {
      title: 'Восстановить доступ',
      error: req.flash('error'),
      userId: user._id.toString(),
      token: req.params.token,
    })
  } catch (e) {
    console.log(e)
  }
})

router.post('/password', async (req, res) => {
  try {
    const { token, userId, password } = req.body

    const user = await User.findOne({
      _id: userId,
      resetToken: token,
      resetTokenExp: { $gt: Date.now() },
    })

    if (!user) {
      req.flash('loginError', 'Время жизни токена истекло')
      return res.redirect('/auth/login')
    }

    user.password = await bcrypt.hash(password, 10)
    user.resetToken = undefined
    user.resetTokenExp = undefined

    await user.save()

    res.redirect('/auth/login')
  } catch (e) {
    console.log(e)
  }
})

module.exports = router
