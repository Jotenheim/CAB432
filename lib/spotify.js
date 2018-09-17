const fs = require('fs');
const request = require('request-promise');
const querystring = require('querystring');

const spotifyKeys = require('../.secrets/spotify');
const cities = require('../bin/cities');
const seeds = require('../bin/seeds');

const userID = 'jvmp2s1p901haxewtxy87iz23';
const accessEncode = new Buffer(spotifyKeys.clientID + ':' + spotifyKeys.clientSecret).toString('base64');

const Spotify = {
  refreshSpotifyToken: async function() {
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

    request.post(authOptions)
      .then((data) => {
        spotifyKeys.accessToken = data.access_token;
        fs.writeFile(`./.secrets/spotify.json`, JSON.stringify(spotifyKeys), 'utf-8', (error) => {
          if (error) { console.log(error); }
        });
      })
      .catch((error) => {
        console.log(error);
      });

    await new Promise((resolve) => setTimeout(() => resolve(), 1000));
  },

  addNewCity: async function(cityName, coords) {
    await this.refreshSpotifyToken();
    const options = {
      url: `https://api.spotify.com/v1/users/${userID}/playlists`,
      body: JSON.stringify({
        name: 'City Vibes - ' + cityName,
        description: `The city vibes playlist for ${cityName}. Listen along to the cities mood and see the current status at bearfoot.design!`
      }),
      headers: {
        'Authorization': 'Bearer ' + spotifyKeys.accessToken,
        'Content-Type': 'application/json'
      }
    };

    await request.post(options)
      .then((data) => {
        cities[cityName] = {
          "name": cityName,
          "country": 'AU',
          "playlistID": JSON.parse(data).id,
          "playlistLink": JSON.parse(data).external_urls.spotify,
          "mood": 0.5,
          "coords": coords
        };

        fs.writeFile('./bin/cities.json', JSON.stringify(cities), 'utf-8');
      })
      .catch((error) => {
        console.log(error);
      });
  },

  addTrackToPlaylist: async function(city, songID) {
    const options = {
      url: `https://api.spotify.com/v1/playlists/${cities[city].playlistID}/tracks?uris=spotify:track:${songID}`,
      headers: { 'Authorization': 'Bearer ' + spotifyKeys.accessToken }
    }

    request.post(options)
      .then((data) => {

      })
      .catch((error) => {
        console.log(error);
      });
  },

  checkForDuplicate: async function(city, songID) {
    let offset = 0;
    let scanning = true;
    let isDuplicate = 'false';
    const playlistID = cities[city].playlistID;

    const options = {
      url: `https://api.spotify.com/v1/playlists/${playlistID}/tracks?` +
        querystring.stringify({
          fields: 'total,items(track(id))',
          offset: offset
        }),
      headers: { 'Authorization': 'Bearer ' + spotifyKeys.accessToken },
      json: true
    }

    await request.get(options)
      .then((data) => {
        data.items.forEach((track) => {
          if(track.track.id === songID) {
            console.log(track.track.id + " - " + songID)
            scanning = false;
            isDuplicate = 'true';
          }
        });
      })
      .catch((error) => {
        console.log(error);
      });

    return isDuplicate;
  },

  findNewTrack: async function (city, semantic) {
    await this.refreshSpotifyToken();

    let keys = Object.keys(seeds);
    let index = [];
    let seed_string = '';

    while (index.length < 5) {
      let value = Math.round(Math.random() * keys.length - 1);
      if(!index.includes(value)) {
        index.push(value);
        seed_string += seeds[keys[value]].id;
        console.log(seeds[keys[value]].name);
        if(index.length != 5) {
          seed_string += ',';
        }
      }
    }

    const options = {
      url: 'https://api.spotify.com/v1/recommendations?' +
        querystring.stringify({
          limit: 10,
          market: cities[city].country,
          target_valence: semantic,
          target_energy: semantic,
          seed_artists: seed_string // Randomise seeds, add artists?
        }),
      headers: { 'Authorization': 'Bearer ' + spotifyKeys.accessToken },
      json: true
    };

    return await request.get(options)
      .then((data) => {
        let songInfo = [];
        let song = Math.round(Math.random() * 9);
        songInfo.push(data.tracks[song].id);
        songInfo.push(data.tracks[song].name);
        return songInfo;
      })
      .catch((error) => {
        console.log(error);
      })
  },

  addSeed: async function (artistName) {
    await this.refreshSpotifyToken();

    const options = {
      url: 'https://api.spotify.com/v1/search?' +
        querystring.stringify({
          q: 'artist:' + artistName,
          type: 'artist',
        }),
      headers: { 'Authorization': 'Bearer ' + spotifyKeys.accessToken },
      json: true
    };

    await request.get(options)
      .then((data) => {
        seeds[data.artists.items[0].name] = {
          name: data.artists.items[0].name,
          id: data.artists.items[0].id,
          image: data.artists.items[0].images[2].url
        }
        fs.writeFile('./bin/seeds.json', JSON.stringify(seeds), 'utf-8');
      })
      .catch((error) => {
        console.log(error);
      });
  }
}

module.exports = Spotify;
