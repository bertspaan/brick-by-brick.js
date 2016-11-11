// Needs:
//   - D3.js
//   - fetch polyfill
//   - promise polyfill

function BrickByBrick (apiUrl, taskId, collections, elements) {
  function checkStatus (response) {
    if (response.status >= 200 && response.status < 300) {
      return response
    } else {
      var error = new Error(response.statusText)
      error.response = response
      error.status = response.status
      throw error
    }
  }

  function parseJSON (response) {
    return response.json()
  }

  function postJSON(url, data, callback) {
    return fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
      .then(checkStatus)
      .then(parseJSON)
  }

  function getJSON(url, callback) {
    return fetch(url, {
      credentials: 'include'
    })
      .then(checkStatus)
      .then(parseJSON)
  }

  // function isFunction (functionToCheck) {
  //   var getType = {}
  //   return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]'
  // }

  function setError (element, err) {
    d3.select(element)
      .append('span')
      .text(err.message)
  }

  function getItem (organizationId, itemId) {
    var url
    if (organizationId && itemId) {
      url = apiUrl + 'organizations/' + organizationId + '/items/' + itemId
    } else {
      url = apiUrl + 'tasks/' + taskId + '/items/random'
      if (collections && collections.length) {
        url += '?collection=' + collections.join(',')
      }
    }

    return getJSON(url)
      .catch(function (err) {
        throw err
      })
  }

  function createOAuthElements (element, data) {
    d3.selectAll('.brick-by-brick-js-oauth').remove()

    var container = d3.select(element)
      .append('div')
      .attr('class', 'brick-by-brick-js-oauth')

    if (data.oauth) {
      // logged in!

      var provider = data.providers.filter(function (provider) {
        return provider.name === data.oauth.provider
      })[0]

      container
        .append('span')
        .text('Logged in with ' + provider.title + ' — ')

      container
        .append('a')
        .attr('href', 'javacript:void();')
        .text('log out')
        .on('click', function () {
          d3.json(data.disconnect, function () {
            getOAuth ()
          })
        })
    } else {
      // not logged in!

      container
        .append('span')
        .text('Not logged in — log in with ')

      container
        .append('ul').selectAll('li').data(data.providers)
        .enter().append('li')
        .append('a')
          .attr('href', function (d) {
            return d.url
          })
          .text(function (d) {
            return d.title
          })
    }
  }

  function postSubmission(organizationId, itemId, data, step, stepIndex) {
    var url = apiUrl + 'submissions'
    var skipped = data ? false : true

    var body = {
      task: {
        id: taskId
      },
      organization: {
        id: organizationId
      },
      item: {
        id: itemId
      }
    }

    if (step !== undefined) {
      body.step = step
    }

    if (stepIndex !== undefined) {
      body.stepIndex = stepIndex
    }

    if (skipped) {
      body.skipped = true
    } else {
      body.data = data
    }

    return postJSON(url, body)
  }

  function getOAuth () {
    if (elements.oauth) {
      var url = apiUrl + 'oauth'
      getJSON(url)
        .then(function (results) {
          if (elements.oauth) {
            createOAuthElements(elements.oauth, results)
          }
        })
        .catch(function (err) {
          console.error(err.message)
        })
    }
  }

  function checkAuthNeeded () {
    var url = apiUrl + 'tasks/' + taskId + '/collections/authorized'
    if (collections && collections.length) {
      url += '?collection=' + collections.join(',')
    }

    getJSON(url)
      .then(function (results) {
        if (!results || !results.length) {
          // No authozired collections for this user + task
          // User needs to log in!

          if (elements.error) {
            setError(elements.error, {
              status: 401,
              message: 'Authentication required, please log in'
            })
          }
        }
      })
      .catch(function (err) {
        console.err(err.message)
      })
  }

  checkAuthNeeded()
  getOAuth()

  return {
    getItem,
    postSubmission
  }
}








// function setError(err) {
//   var message

//   if (err) {
//     if (err.status === 404) {
//       message = 'Done! Finished! Nothing to do!'
//     } else {
//       message = err.message
//     }
//   } else {
//     message = 'Error getting task from server'
//   }

//   d3.select('#error > *').remove()
//   d3.select('#error').append('span').html(message)
// }

