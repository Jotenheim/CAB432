const fs = require('fs');
const twit = require('twit');
const senti = require('sentiment');
const twitterKeys = require('../.secrets/twitter');
const cities = require('../bin/cities');

const twitter = new twit(twitterKeys);
const Sentiment = new senti();

const count = 5;

const Twitter = {
  getCityMood: async function(city) {
    return await twitter.get('search/tweets', { q: 'Mood', result_type: 'recent', locations: cities[city].coords, lang: 'en', count: count })
      .then((result) => {
        let mood = 0;
        let tweetScores = [];
        for (let i = 0; i < count; i++) {
          let score = Sentiment.analyze(result.data.statuses[i].text).comparative;
          mood += score;
          tweetScores.push({ score: score , text: result.data.statuses[i].text });
        }
        tweetScores.sort((a, b) => b.score - a.score); // Get High/Low 3

        mood = (mood + 5) / 10;
        cities[city].mood = mood;
        fs.writeFile('./bin/cities.json', JSON.stringify(cities, null, 2), 'utf-8', (error) => {
          if (error) { console.log(error); }
        });

        return mood;
      })
    .catch((error) => {
        console.log(error);
      });
  }
}

module.exports = Twitter;
