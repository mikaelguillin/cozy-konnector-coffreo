const {
  BaseKonnector,
  requestFactory,
  signin,
  saveFiles,
  log
} = require('cozy-konnector-libs')
const request = requestFactory({
  // the debug mode shows all the details about http request and responses. Very useful for
  // debugging but very verbose. That is why it is commented out by default
  debug: false,
  // activates [cheerio](https://cheerio.js.org/) parsing on each page
  cheerio: false,
  // If cheerio is activated do not forget to deactivate json parsing (which is activated by
  // default in cozy-konnector-libs
  json: true,
  // this allows request-promise to keep cookies between requests
  jar: true
})

const baseUrl = 'https://www.coffreo.com'

module.exports = new BaseKonnector(start)

// The start function is run by the BaseKonnector instance only when it got all the account
// information (fields). When you run this connector yourself in "standalone" mode or "dev" mode,
// the account information come from ./konnector-dev-config.json file
async function start(fields) {
  log('info', 'Authenticating ...')
  await authenticate(fields.login, fields.password)
  log('info', 'Successfully logged in')
  // The BaseKonnector instance expects a Promise as return of the function
  // log('info', 'Fetching the list of documents')
  await request('https://coffreo.com')
  // cheerio (https://cheerio.js.org/) uses the same api as jQuery (http://jquery.com/)
  log('info', 'Parsing list of documents')
  await downloadDocuments()
}

// this shows authentication using the [signin function](https://github.com/konnectors/libs/blob/master/packages/cozy-konnector-libs/docs/api.md#module_signin)
// even if this in another domain here, but it works as an example
function authenticate(username, password) {
  return signin({
    url: baseUrl,
    formSelector: 'form',
    formData: { _username: username, _password: password },
    // the validate function will check if the login request was a success. Every website has
    // different ways respond: http status code, error message in html ($), http redirection
    // (fullResponse.request.uri.href)...
    validate: statusCode => {
      return statusCode === 200 || log('error', 'Invalid credentials')
    }
  })
}

// The goal of this function is to parse a html page wrapped by a cheerio instance
// and return an array of js objects which will be saved to the cozy by saveBills (https://github.com/konnectors/libs/blob/master/packages/cozy-konnector-libs/docs/api.md#savebills)
function downloadDocuments() {
  // you can find documentation about the scrape function here :
  // https://github.com/konnectors/libs/blob/master/packages/cozy-konnector-libs/docs/api.md#scrape

  request('https://coffreo.com/api/v1/document', (error, response, body) => {
    const documents = body.documents
    let docFiles = []

    documents.forEach(document => {
      docFiles.push({
        fileurl: `https://coffreo.com/api/v1/document/${document.id}/download`,
        filename: `${document.name}.pdf`
      })
    })

    saveFiles(docFiles, 'test')
  })
}
