const express = require('express')
const handlebars = require('express-handlebars')
const session = require('express-session')
const MongoStore = require('connect-mongodb-session')(session)
const mongoose = require('mongoose')
const path = require('path')
const csrf = require('csurf')
const flash = require('connect-flash')

const homeRoutes = require('./routes/home')
const coursesRoutes = require('./routes/courses')
const addRoutes = require('./routes/add')
const cartRoutes = require('./routes/cart')
const ordersRoutes = require('./routes/orders')
const authRouter = require('./routes/auth')

const variablesMiddleware = require('./middleware/variables')
const userMiddleware = require('./middleware/user')

const app = express()

const { MONGODB_URI, SESSION_SECRET } = require('./keys')

const store = new MongoStore({
  collection: 'sessions',
  uri: MONGODB_URI,
})

const hbs = handlebars.create({
  defaultLayout: 'main',
  extname: 'hbs',
  helpers: require('./utils/hbs-helpers'),
})

app.engine('hbs', hbs.engine)
app.set('view engine', 'hbs')
app.set('views', 'views')

app.use(express.static(path.join(__dirname, 'public')))
app.use(express.urlencoded({ extended: true }))
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store,
  })
)
app.use(csrf())
app.use(flash())
app.use(variablesMiddleware)
app.use(userMiddleware)

app.use('/', homeRoutes)
app.use('/courses', coursesRoutes)
app.use('/add', addRoutes)
app.use('/cart', cartRoutes)
app.use('/orders', ordersRoutes)
app.use('/auth', authRouter)

const PORT = process.env.PORT || 3000

const start = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useFindAndModify: false,
    })

    app.listen(PORT, () => console.log(`Server is running on port ${PORT}`))
  } catch (e) {
    console.log(e)
  }
}

start()
