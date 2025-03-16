const { Router } = require('express')
const Course = require('../models/course')
const { validationResult } = require('express-validator/check')

const auth = require('../middleware/auth')
const { courseValidators } = require('../utils/validators')

const router = Router()

const isOwner = (course, req) =>
  course.userId.toString() === req.user._id.toString()

router.get('/', async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('userId', 'email name')
      .select('price title img')
      // .lean трансформирует в обычный JS объект, чтобы не было ошибок Handlebars
      .lean()

    res.render('courses', {
      title: 'Курсы',
      isCourses: true,
      userId: req.user ? req.user._id.toString() : null,
      courses,
    })
  } catch (e) {
    console.log(e)
  }
})

router.get('/:id/edit', auth, async (req, res) => {
  try {
    if (!req.query.allow) {
      return res.redirect('/')
    }

    // .lean трансформирует в обычный JS объект, чтобы не было ошибок Handlebars
    const course = await Course.findById(req.params.id).lean()

    if (!isOwner(course, req)) {
      return res.redirect('/courses')
    }

    return res.render('course-edit', {
      course,
      title: `Редактировать ${course.title}`,
    })
  } catch (e) {
    console.log(e)
  }
})

router.post('/edit', auth, courseValidators, async (req, res) => {
  const errors = validationResult(req)
  const { id, ...restBody } = req.body

  if (!errors.isEmpty()) {
    return res.status(422).redirect(`/courses/${id}/edit?allow=true`)
  }

  try {
    const course = await Course.findById(id)

    if (!isOwner(course, req)) {
      return res.redirect('/courses')
    }
    Object.assign(course, restBody)
    await course.save()

    res.redirect('/courses')
  } catch (e) {
    console.log(e)
  }
})

router.post('/remove', auth, async (req, res) => {
  try {
    await Course.deleteOne({
      _id: req.body.id,
      userId: req.user._id,
    })
    res.redirect('/courses')
  } catch (e) {
    console.log(e)
  }
})

router.get('/:id', async (req, res) => {
  try {
    // .lean трансформирует в обычный JS объект, чтобы не было ошибок Handlebars
    const course = await Course.findById(req.params.id).lean()

    res.render('course', {
      layout: 'empty',
      title: `Курс ${course.title}`,
      course,
    })
  } catch (e) {
    console.log(e)
  }
})

module.exports = router
