import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import mongoose from 'mongoose'
import crypto from 'crypto'
import bcrypt from 'bcrypt-nodejs'

// Defines the port the app will run on. Defaults to 8080, but can be
// overridden when starting the server. For example:

const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost/mendlybackend'
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })

mongoose.Promise = Promise

const User = mongoose.model('User', {
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  accessToken: {
    type: String,
    default: () => crypto.randomBytes(128).toString('hex')
  }
})

const Assignment = mongoose.model('Assignment', {
  situation: {
    type: String
  },
  tanke: {
    type: String
  },
  kansla: {
    type: String
  },
  kropp: {
    type: String
  },
  lukt: {
    type: String
  },
  assignmentId: {
    type: String
  },
  complete: {
    type: Boolean,
    required: true
  }
})

const Admin = mongoose.model('Admin', {
  adminname: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  accessToken: {
    type: String,
    default: () => crypto.randomBytes(128).toString('hex')
  }
})

const authenticateUser = async (req, res, next) => {
  const user = await User.findOne({ accessToken: req.header('Authorization') })
  if (user) {
    req.user = user
    next()
  } else {
    res.status(401).json({ loggedOut: true })
  }
}

const authenticateAdmin = async (req, res, next) => {
  const admin = await Admin.findOne({
    accessToken: req.header('Authorization')
  })
  if (admin) {
    req.admin = admin
    next()
  } else {
    res.status(401).json({ loggedOut: true })
  }
}

const port = process.env.PORT || 8080
const app = express()

app.use(cors())
app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.send('Backend for mendly tools project')
})

//create user
app.post('/users', async (req, res) => {
  try {
    const { username, email, password } = req.body
    const newUser = await new User({
      username,
      email,
      password: bcrypt.hashSync(password)
    })
    newUser.save()
    res.status(201).json(newUser)
  } catch (err) {
    res
      .status(400)
      .json({ messsage: 'Could not create user', error: err.errors })
  }
})

// return all asignments for the users or something
// app.get('/assignments', (req)

// app.get('/assignemnts/:id) //
// app.post('/assigment/:id) // give answers to the assignement
// app.delete('/')

app.post('/assignment', async (req, res) => {
  try {
    const {
      situation,
      tanke,
      kansla,
      lukt,
      kropp,
      assignmentId,
      complete
    } = req.body
    const newAssignment = await new Assignment({
      situation,
      tanke,
      kansla,
      lukt,
      kropp,
      assignmentId,
      complete
    })
    newAssignment.save()
    res.status(201).json(newAssignment)
  } catch (err) {
    res
      .status(400)
      .json({ messsage: 'Could not create Assignment', error: err.errors })
  }
})

// find all assignments
app.get('/assignment', async (req, res) => {
  const assignment = await Assignment.find()
  res.json(assignment)
})

// sort and find specific assignments
app.get('/assignment/:assignmentId', (req, res) => {
  const assignmentId = req.params.assignmentId
  console.log(`GET / assignment/${assignmentId}`)
  Assignment.find({ assignmentId: assignmentId }).then((results) => {
    res.json(results)
  })
})

//create admin
app.post('/admin', async (req, res) => {
  try {
    const { adminname, password } = req.body
    const newAdmin = await new Admin({
      adminname,
      password: bcrypt.hashSync(password)
    })
    newAdmin.save()
    res.status(201).json(newAdmin)
  } catch (err) {
    res
      .status(400)
      .json({ messsage: 'Could not create Admin', error: err.errors })
  }
})

// Route to logged in user
app.get('/userhome', authenticateUser, (req, res) => {
  try {
    res.status(200).json({
      status: 'success',
      message: 'ure logged in'
    })
  } catch (err) {
    res.status(403).json({ message: 'Not authorized', error: err.errors })
  }
})

// Route to logged in admin
app.get('/adminhome', authenticateAdmin, (req, res) => {
  try {
    res.status(200).json({
      status: 'success',
      message: 'ure logged in'
    })
  } catch (err) {
    res.status(403).json({ message: 'Not authorized', error: err.errors })
  }
})

// Rout for user logging in
app.post('/userlogin', async (req, res) => {
  console.log(req.body)
  const user = await User.findOne({ username: req.body.username })
  if (user && bcrypt.compareSync(req.body.password, user.password)) {
    res.json({
      username: user.username,
      userId: user._id,
      accessToken: user.accessToken,
      message: 'yaye ure in'
    })
  } else {
    res.status(401).json({
      statusCode: 401,
      notFound: true,
      error: 'Login failed, username or password incorrect'
    })
  }
})

// Rout for admin logging in
app.post('/adminlogin', async (req, res) => {
  const admin = await Admin.findOne({ adminname: req.body.adminname })
  if (admin && bcrypt.compareSync(req.body.password, admin.password)) {
    res.json({
      adminname: admin.adminname,
      adminId: admin._id,
      accessToken: admin.accessToken,
      message: 'yaye ure in'
    })
  } else {
    res.status(401).json({
      statusCode: 401,
      notFound: true,
      error: 'Login failed, admin or password incorrect'
    })
  }
})

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
