const express = require('express')
const router = express.Router()
// const debug = require('debug')('app:students')
const students = require('../helpers/students')
const statuses = require('../helpers/statuses')

const { UniqueViolationError } = require('objection')
const { NotFoundError } = require('objection')

/* GET students listing. */
router.get('/', async (req, res) => {
  const status = req.query.status
  const result = await students.getAllStudents({
    filters: {
      status
    }
  })

  // handle error
  if (result.err) {
    // console.log('entered result.err')
    const err = result.err
    res.status(500).send({
      message: err.message,
      type: 'UnknownError',
      data: {}
    })
    return
  }

  res.json(result)
})

/* GET student by ID */
router.get('/:id', async (req, res) => {
  const result = await students.getStudentById(req.params.id)
  //  console.log(result.err)

  // handle error
  if (result.err) {
    const err = result.err
    if (err instanceof NotFoundError) {
      res.status(409).send({
        message: err.message,
        type: 'StudentNotFound',
        data: {}
      })
    } else {
      res.status(500).send({
        message: err.message,
        type: 'UnknownError',
        data: {}
      })
    }

    return
  }

  res.json(result)
})

/* POST students listing */
router.post('/', async (req, res) => {
  // If EnglishProficiency is empty
  if (!req.body.EnglishProficiency || req.body.EnglishProficiency === "") {
    delete req.body.EnglishProficiency
  }
  // If request does not contain StatusID
  if (req.body.StatusID == null) {
    let statusString
    // If request contains a statusString
    if (req.body.StatusString != null) {
      statusString = req.body.StatusString
      delete req.body.StatusString
    }
    const status = await students.getStatusPromise(statusString)
    req.body.StatusID = status.StatusID
  }

  // If request does not contain NativeLanguageID
  try {
    if (req.body.NativeLanguageID == null) {
      let nativeLanguageString
      // If request contains a nativeLanguageString
      if (req.body.NativeLanguageString != null) {
        nativeLanguageString = req.body.NativeLanguageString
        delete req.body.NativeLanguageString
      }
      const nativeLanguage = await students.getNativeLanguagePromise(
        nativeLanguageString
      )
      req.body.NativeLanguageID = nativeLanguage.NativeLanguageID
    }
  } catch (err) {
    res.status(400).send({
      message: err.message,
      type: 'MissingParams',
      data: {}
    })
  }

  const result = await students.addStudent(req.body)

  // handle error
  if (result.err) {
    const err = result.err
    if (err instanceof UniqueViolationError) {
      res.status(409).send({
        message: err.message,
        type: 'UniqueViolation',
        data: {
          columns: err.columns,
          table: err.table,
          constraint: err.constraint
        }
      })
    } else {
      res.status(500).send({
        message: err.message,
        type: 'UnknownError',
        data: {}
      })
    }

    return
  }

  res.status(200).json(result)
})

/* PATCH student listing */
// on Postman: http://localhost:3001/students/1
router.patch('/:id', async (req, res) => {
  if (req.body.NativeLanguageString) {
    try {
      const nativeLanguage = await students.getNativeLanguagePromise(
        req.body.NativeLanguageString
      )
      req.body.NativeLanguageID = nativeLanguage.NativeLanguageID
      delete req.body.NativeLanguageString
    } catch (err) {
      return res.status(500).send({
        message: err.message,
        type: 'UnknownError with NativeLanguage',
        data: {}
      })
    }
  }
  // If EnglishProficiency is empty, delete it from the request body
  if (!req.body.EnglishProficiency || req.body.EnglishProficiency === "") {
    delete req.body.EnglishProficiency
  }
  // If request does not contain StatusID and contains a StatusString
  if (req.body.StatusID == null && req.body.StatusString != null) {
    const statusString = req.body.StatusString
    delete req.body.StatusString
    const status = await statuses.getStatusByStatusString(statusString)
    req.body.StatusID = status.StatusID
  }

  const result = await students.patchStudent(req.params.id, req.body);

  // handle error
  if (result.err) {
    const err = result.err
    if (err instanceof NotFoundError) {
      res.status(409).send({
        message: err.message,
        type: 'StudentNotFound',
        data: {}
      })
    } else {
      res.status(500).send({
        message: err.message,
        type: 'UnknownError. Database contraints may be violated',
        data: {}
      })
    }

    return
  }
  res.status(200).json(result)
})

/* GET status by StudentID */
router.get('/:id/status', async (req, res) => {
  const result = await students.getStatusByStudentId(req.params.id)
  // console.log(result.err)

  // if student not found
  if (result.length === 0) {
    res.status(409).send({
      message: 'StudentNotFound',
      type: 'StudentNotFound',
      data: {}
    })
    return
  }

  // handle error
  if (result.err) {
    // console.log('entered result.err')
    const err = result.err
    res.status(500).send({
      message: err.message,
      type: 'UnknownError',
      data: {}
    })
    return
  }

  res.json(result)
})

module.exports = router
