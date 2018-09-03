const fs = require('fs');
const express = require('express');
const router = express.Router();
const twit = require('twit');
const twitterKeys = require('../.secrets/twitterKeys');
const senti = require('sentiment');
const cities = require('../bin/cities');

const Twitter = new twit(twitterKeys);
const Sentiment = new senti();

const count = 100;

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
  res.render('index', { title: cities.brisbane.mood  });
});

getCityMood('brisbane');
//setInterval(getCityMood, 30000, 'brisbane');

module.exports = router;
