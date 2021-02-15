const functions = require('firebase-functions')
const fetch = require('node-fetch')
const cors = require('cors')({ origin: true })

exports.searchOnOxford = functions
  .region('asia-southeast2')
  .https.onRequest((req, resp) => {
    cors(req, resp, () => {
      if (!req.query.keyword) {
        return resp.status(403).send('keyword is required')
      }

      fetch(
        'https://www.oxfordlearnersdictionaries.com/definition/english/' +
          req.query.keyword
      )
        .then((body) => body.text())
        .then((body) => resp.status(200).send(body))
    })
  })
