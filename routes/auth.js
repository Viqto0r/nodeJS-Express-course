const { Router } = require('express')
const User = require('../models/user')
const bcrypt = require('bcryptjs')

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

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    const candidate = await User.findOne({ email })

    if (!candidate) {
      req.flash('login-error', 'Неверный логин или пароль')

      return res.redirect('/auth/login')
    }

    const areSame = await bcrypt.compare(password, candidate.password)

    if (!areSame) {
      req.flash('login-error', 'Неверный логин или пароль')

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

router.post('/register', async (req, res) => {
  try {
    const { email, password, repeat, name } = req.body

    const candidate = await User.findOne({ email })

    if (candidate) {
      req.flash('register-error', 'Пользователь с таким email уже существует')
      res.redirect('/auth/login#register')
    } else {
      const hashPassword = await bcrypt.hash(password, 10)

      const user = new User({
        email,
        name,
        password: hashPassword,
        cart: { items: [] },
      })

      await user.save()

      res.redirect('/auth/login')
    }
  } catch {
    console.log(e)
  }
})

module.exports = router
