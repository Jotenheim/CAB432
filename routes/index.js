const fs = require('fs');
const request = require('request');
const querystring = require('querystring');
const express = require('express');
const router = express.Router();
const twit = require('twit');
const senti = require('sentiment');

const twitterKeys = require('../.secrets/twitter');
const spotifyKeys = require('../.secrets/spotify');
const cities = require('../bin/cities');

const Twitter = new twit(twitterKeys);
const Sentiment = new senti();

const count = 100;
const userID = 'jvmp2s1p901haxewtxy87iz23';
const accessEncode = new Buffer(spotifyKeys.clientID + ':' + spotifyKeys.clientSecret).toString('base64');

const addNewCity = function(name) {
  refreshSpotifyToken();

  const options = {
    url: `https://api.spotify.com/v1/users/${userID}/playlists`,
    body: JSON.stringify({
      name: 'City Vibes - ' + name,
      description: 'The city vibes playlist for ' + name + '. Listen along to the cities mood and see the current status at https://twitter.com/BearfootDev?lang=en.'
    }),
    headers: {
      'Authorization': 'Bearer ' + spotifyKeys.accessToken,
      'Content-Type': 'application/json'
    }
  };

  request.post(options, function(error, response, body) {
    cities[name] = {
      "name": name,
      "country": 'AU',
      "playlistID": JSON.parse(response.body).id,
      "playlistLink": JSON.parse(response.body).external_urls.spotify,
      "mood": 0.5,
      "coords": [152.9063, -27.7508, 153.3152, -27.19]
    };

    fs.writeFile('./bin/cities.json', JSON.stringify(cities), 'utf-8');
  });
}

const refreshSpotifyToken = function() {
  const authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: {
      'Authorization': 'Basic ' + accessEncode
    },
    form: {
      grant_type: 'refresh_token',
      refresh_token: spotifyKeys.refreshToken
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error) {
      spotifyKeys.accessToken = body.access_token;
      fs.writeFile(`./.secrets/spotify.json`, JSON.stringify(spotifyKeys), 'utf-8');
    }
  });
}

const addSpotifyTrack = function(valence) {
  const country = 'AU';

  const options = {
    url: 'https://api.spotify.com/v1/recommendations?' +
      querystring.stringify({
        limit: 5,
        market: country,
        target_valence: valence,
        seed_artists: '2yZxOCzq3fkvlApnYFOd8H,4tKUoNubW02udXOh7SLtXV,4YrKBkKSVeqDamzBPWVnSJ,0oSGxfWSnnOXhD2fKuz2Gy,7jy3rLJdDQY21OgRLCZ9sD'
      }),
    headers: { 'Authorization': 'Bearer ' + spotifyKeys.accessToken },
    json: true
  };

  console.log(options);

  request.get(options, function(error, response, body) {
        if(!error) {
          console.log(body);
        } else {
          console.log(error);
        }
  });
}

const getCityMood = function(city) {
  let mood = 0;
  Twitter.get('search/tweets', { q: 'Mood', result_type: 'recent', locations: cities[city].coords, lang: 'en', count: count }, function(error, tweets, response) {
    let tweetScores = [];
    for (let i = 0; i < count; i++) {
      let score = Sentiment.analyze(tweets.statuses[i].text).comparative;
      mood += score;
      tweetScores.push({ score: score , text: tweets.statuses[i].text });
    }
    tweetScores.sort((a, b) => b.score - a.score); // Get High/Low 3

    mood = (mood + 5) / 10;
    cities[city].mood = mood;
    fs.writeFile('./bin/cities.json', JSON.stringify(cities, null, 2), 'utf-8');
    console.log(cities[city].mood);
  });
}

/* GET home page. */
router.get('/', function(req, res, next) {
  request.post('https://api.spotify.com/v1/me?')
  //res.render('index', { title: cities.brisbane.mood  });
});

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


//getCityMood('brisbane');
setInterval(refreshSpotifyToken, 360000);
//setTimeout(addSpotifyTrack, 5000, 0);
//addNewCity('Brisbane');

module.exports = router;
