const express = require('express');
const Twitter = require('./twitter');
const Spotify = require('./spotify');

const router = express.Router();

const main = async function() {
  //const mood = await Twitter.getCityMood('Brisbane');
  //const runtime = await Spotify.addTrack(mood);
  //setTimeout(main, runtime - 30000);
  //setInterval(refreshSpotifyToken, 300000);
  //setTimeout(addSpotifyTrack, 5000, 0);
  //addNewCity('Brisbane');
  Spotify.checkForDuplicate('Brisbane', '5UWwZ5lm5PKu6eKsHAGxOk');
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.end('Sup');
  //res.render('index', { title: cities.brisbane.mood  });
});

main();
/*
router.get('/login', function(req, res, next) {
  res.redirect(`https://accounts.spotify.com/authorize?response_type=code&client_id=${spotifyKeys.clientID}&scope=playlist-modify-public playlist-read-private playlist-modify-private&redirect_uri=http://bearfoot.design/callback`);
});

router.get('/callback', function(req, res, next) {
  const authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: {
      'Authorization': 'Basic ' + (new Buffer(spotifyKeys.clientID + ':' + spotifyKeys.clientSecret).toString('base64'))
    },
    form: {
      code: req.query.code,
      redirect_uri: 'http://bearfoot.design/callback',
      grant_type: 'authorization_code'
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if(!error) {
      var access_token = body.access_token,
          refresh_token = body.refresh_token;

      var options = {
        url: 'https://api.spotify.com/v1/me',
        headers: { 'Authorization': 'Bearer ' + access_token },
        json: true
      };

      // use the access token to access the Spotify Web API
      request.get(options, function(error, response, body) {
        console.log(body);
      });

      res.end(`access_token = ${access_token}
              refresh_token = ${refresh_token}`);
    }
  });
});
*/

module.exports = router;
