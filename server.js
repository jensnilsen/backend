import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import mongoose from 'mongoose'
import crypto from 'crypto'
import bcrypt from 'bcrypt-nodejs'

const mongoUrl = process.env.MONGO_URL || 'https://mendly.herokuapp.com/'
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
  assignmentId: {
    type: String
  },
  complete: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
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

// posting new assignment
app.post('/assignment', async (req, res) => {
  try {
    const {
      situation,
      tanke,
      kansla,
      kropp,
      assignmentId,
      complete,
      createdAt,
    } = req.body
    const newAssignment = await new Assignment({
      situation,
      tanke,
      kansla,
      kropp,
      assignmentId,
      complete,
      createdAt,
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
app.get('/assignments', async (req, res) => {
  console.log('getting assignments')
  const assignments = await Assignment.find()
  res.json(assignments)
})

// Find all users
app.get('/findusers', async (req, res) => {
  console.log('fetching')
  const users = await User.find()
  res.json(users)
})

// sort and find one user
app.get('/findusers/:accessToken', (req, res) => {
  const accessToken = req.params.accessToken
  console.log(`GET / user/${accessToken}`)
  User.find({ accessToken: accessToken }).then((results) => {
    res.json(results)
  })
})

// update form by _Id
app.put('/:_id/update', async (req, res) => {
  try {
    const uppdateAssignment = await Assignment.updateOne(
      { _id: req.params._id },
      {
        situation: req.body.situation,
        kropp: req.body.kropp,
        tanke: req.body.tanke,
        kansla: req.body.kansla,
        complete: req.body.complete,
      }
    )
    res.status(200).json({ uppdateAssignment, message: 'update' })
  } catch (err) {
    res.status(400).json({ message: 'could not save update', errors: err.errors })
  }
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