const { Router } = require('express')
const Order = require('../models/order')

const auth = require('../middleware/auth')

const router = Router()

router.get('/', auth, async (req, res) => {
  try {
    const orders = await Order.find({ 'user.userId': req.user._id })
      .populate('user.userId')
      // .lean трансформирует в обычный JS объект, чтобы не было ошибок Handlebars
      .lean()

    res.render('orders', {
      isOrders: true,
      title: 'Заказы',
      orders: orders.map((o) => {
        return {
          ...o,
          price: o.courses.reduce((acc, c) => {
            return acc + c.count * c.course.price
          }, 0),
        }
      }),
    })
  } catch (e) {
    console.log(e)
  }
})

router.post('/', auth, async (req, res) => {
  try {
    const user = await req.user.populate('cart.items.courseId').execPopulate()

    const courses = user.cart.items.map((item) => ({
      count: item.count,
      course: { ...item.courseId._doc },
    }))

    const order = new Order({
      user: {
        name: req.user.name,
        userId: req.user,
      },
      courses,
    })

    await order.save()
    await req.user.clearCart()

    res.redirect('/orders')
  } catch (e) {
    console.log(e)
  }
})

module.exports = router
