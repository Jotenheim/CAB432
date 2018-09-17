const fs = require('fs');
const twit = require('twit');
const senti = require('sentiment');
const twitKeys = require('../.secrets/twitter');
const cities = require('../bin/cities');

const twitter = new twit(twitKeys);
const Sentiment = new senti();

const count = 100;

const Twitter = {
  getCityMood: async function(city) {
    let params = {
      q: 'Mood OR Feeling OR Emotion',
      result_type: 'mixed',
      geocode: cities[city].coords,
      lang: 'en',
      count: count };

    return await twitter.get('search/tweets', params)
      .then((result) => {
        let mood = 0;
        let tweetScores = [];
        for (let i = 0; i < result.data.statuses.length ; i++) {
          let score = Sentiment.analyze(result.data.statuses[i].text).comparative;
          mood += score;
          tweetScores.push({ score: score , text: result.data.statuses[i].text });
        }
        tweetScores.sort((a, b) => b.score - a.score); // Get High/Low 3

        // An accurate formula would be ((mood / 100) + 5) / 10, but this leads to boring results
        // The average of 100 tweets tends to be average, the formula I used instead amplifies
        // the mood of a city, leading to more interesting results
        mood = ((mood / 2) + 5) / 10;
        cities[city].mood = mood;

        fs.writeFile('./bin/cities.json', JSON.stringify(cities, null, 2), 'utf-8', (error) => {
          if (error) { console.log(error); }
        });

        return mood;
      })
    .catch((error) => {
        console.log(error.message);
      });
  },

  postNewCity: async function(city) {
    twitter.post('statuses/update', { status: `Hey, we're now following ${city}! Check out the vibe at ${cities[city].playlistLink}!`})
      .then((data) => {
        console.log(data.response);
      })
      .catch((error) => {
        console.log(error);
      });
  },

  postCityUpdate: async function(city, mood, songName) {
    let moodString = "";
    if (mood > .8) {
      moodString += "on top of the world!";
    } else if (mood > .65) {
      moodString += "pretty good.";
    } else if (mood > .5) {
      moodString += "meh.";
    } else if (mood > .35) {
      moodString += "bad...";
    } else if (mood > .2) {
      moodString += "awful...";
    } else {
      moodString += "the absolute worst!";
    }

    twitter.post('statuses/update', { status: `So ${city} is feeling ${moodString} So we added "${songName}" so you can listen along. Check it out at ${cities[city].playlistLink}!`})
      .then((data) => {

      })
      .catch((error) => {
        console.log(error);
      });
  }
}

module.exports = Twitter;
