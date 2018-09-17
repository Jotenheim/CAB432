const express = require('express');
const Twitter = require('../lib/twitter');
const Spotify = require('../lib/spotify');
const Here = require('../lib/hereGeoCode');

const cities = require('../bin/cities');
const seeds = require('../bin/seeds');

const router = express.Router();

const updateCities = async function() {
  for (var city in cities) {
    const mood = await Twitter.getCityMood(city);
    let addingSong = true;
    console.log(city + ": " + mood);

    while (addingSong) {
      const songInfo = await Spotify.findNewTrack(city, mood);
      const isDuplicate = await Spotify.checkForDuplicate(city, songInfo[0]);
      if(isDuplicate === 'false') {
        addingSong = false;
        Spotify.addTrackToPlaylist(city, songInfo[0]);
        Twitter.postCityUpdate(city, mood, songInfo[1]);
      }
    }

    console.log();
  }
}

const addNewCity = async function(cityName) {
  const coords = await Here.getCityCoords(cityName);
  await Spotify.addNewCity(cityName, coords);
  Twitter.postNewCity(cityName);
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { active: 'index', cities });
});

router.get('/artists', function(req, res, next) {
  let keys = Object.keys(seeds);
  let seeds1 = {};
  let seeds2 = {};
  let count = 0;

  for (let i = 0; i < keys.length; i++) {
    let key = keys[i];

    if (i % 2 === 0) {
      seeds1[key] = seeds[key];
    } else {
      seeds2[key] = seeds[key];
    }
  }

  res.render('artists', { active: 'artists', seeds1, seeds2 });
});

router.post('/artists', async function(req, res, next) {
  await Spotify.addSeed(req.body.artistName);
  res.redirect('/artists');
});

router.get('/cities', function(req, res, next) {
  res.render('cities', { active: 'cities', cities });
})

router.post('/cities', async function(req, res, next) {
  await addNewCity(req.body.cityName);
  res.redirect('/cities');
})

/* Find a new song for each city every 5 minutes */
updateCities();
setInterval(updateCities, 300000);

/*
This code was used to get the spotify token, it is redundant now, but kept here if ever required

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
