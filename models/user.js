const { Schema, model } = require('mongoose')

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  name: String,
  password: {
    type: String,
    required: true,
  },
  avatarUrl: String,
  resetToken: String,
  resetTokenExp: Date,
  cart: {
    items: [
      {
        count: {
          type: Number,
          required: true,
          default: 1,
        },
        courseId: {
          type: Schema.Types.ObjectId,
          ref: 'Course',
          required: true,
        },
      },
    ],
  },
})

userSchema.methods.addToCart = function (course) {
  const items = [...this.cart.items]

  const candidate = items.find(
    (c) => c.courseId.toString() === course._id.toString()
  )

  if (!!candidate) {
    candidate.count++
  } else {
    items.push({
      courseId: course._id,
      count: 1,
    })
  }

  this.cart = { items }

  return this.save()
}

userSchema.methods.removeFromCart = function (id) {
  let items = [...this.cart.items]

  const candidate = items.find((c) => c.courseId.toString() === id)

  if (candidate.count === 1) {
    items = items.filter((i) => i !== candidate)
  } else {
    candidate.count--
  }

  this.cart = { items }

  return this.save()
}

userSchema.methods.clearCart = function () {
  this.cart.items = []

  this.save()
}

module.exports = model('User', userSchema)
