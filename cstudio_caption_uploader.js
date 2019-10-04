const axios         = require('axios')
const csv           = require('csvtojson')
const fs            = require('fs')
const { prompt }    = require('enquirer')
const FormData      = require('form-data')
var throttledQueue  = require('throttled-queue');
var throttle        = throttledQueue(1, 1000);
const csvPath       ='./subtitle_map.csv'

//This script runs under the assumption you have a list of file ids and file paths in a csv so that it can map the subtitle data
// to the video on Canvas studio easily. To run it, you'll need to have the Studio domain you are working with and
// the session token for working with Studio. You also need to make sure you know the user id you're using for
// logging into Canvas Studio. If either the user id or the token are incorrect or expired, the script will return a
// "bad credentials" error.

const response = prompt([
  {
  type: 'input',
  name: 'domain',
  message: 'What is the Canvas Studio domain'
  },
  {
    type: 'input',
    name: 'user_id',
    message: 'What is your Canvas Studio User ID#'
  },
  {
    type: 'input',
    name: 'token',
    message: 'What is your session token'
  },
])
.then(input => {
  csv()
  .fromFile(csvPath)
  .then((jsonObj) => {
    jsonObj.forEach(media => {

      const capExt = media.sub_id + ".srt"

      const form = new FormData()
      const cap = fs.createReadStream(capExt)

      form.append('caption_file', cap)
      form.append('srclang', "en")
      const formHeaders = form.getHeaders()
      formHeaders.authorization = `Bearer user_id="${input.user_id}", token="${input.token}"`

      throttle(function() {
          axios.post(`https://${input.domain}.instructuremedia.com/api/media_management/media/${media.media_id}/caption_files`, form, {headers: {...formHeaders}})
      .then(function (response) {
            console.log(response.data);
          })
          .catch(function (error) {
            console.log(error.response.data);
          });
        })
    })
  })
  })
