const fs = require('fs');
const request = require('request-promise');
const querystring = require('querystring');

const spotifyKeys = require('../.secrets/spotify');
const cities = require('../bin/cities');
const seeds = require('../bin/seeds');

const count = 100;
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

  addNewCity: async function(name) {
    await this.refreshSpotifyToken();
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

    request.post(options)
      .then((data) => {
        cities[name] = {
          "name": name,
          "country": 'AU',
          "playlistID": JSON.parse(data).id,
          "playlistLink": JSON.parse(data).external_urls.spotify,
          "mood": 0.5,
          "coords": [152.9063, -27.7508, 153.3152, -27.19]
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
        console.log(data);
      })
      .catch((error) => {
        console.log(error);
      });
  },

  checkForDuplicate: async function(city, songID) {
    let offset = 0;
    let scanning = true;
    const playlistID = cities[city].playlistID;

    while (scanning) {
      const options = {
        url: `https://api.spotify.com/v1/playlists/${playlistID}/tracks?` +
          querystring.stringify({
            fields: 'total,items(track(id))',
            offset: offset
          }),
        headers: { 'Authorization': 'Bearer ' + spotifyKeys.accessToken },
        json: true
      }

      return await request.get(options)
        .then((data) => {
          data.items.forEach((track) => {
            if(track.track.id === songID) {
              scanning = false;
              return 'true';
            }
          });
          return false;
        })
        .catch((error) => {
          console.log(error);
        });
    }
  },

  findNewTrack: async function (city, semantic) {
    await this.refreshSpotifyToken();

    const options = {
      url: 'https://api.spotify.com/v1/recommendations?' +
        querystring.stringify({
          limit: 100,
          market: cities[city].country,
          target_valence: semantic,
          target_energy: semantic,
          seed_artists: '2yZxOCzq3fkvlApnYFOd8H,4tKUoNubW02udXOh7SLtXV,4YrKBkKSVeqDamzBPWVnSJ,0oSGxfWSnnOXhD2fKuz2Gy,7jy3rLJdDQY21OgRLCZ9sD' // Randomise seeds, add artists?
        }),
      headers: { 'Authorization': 'Bearer ' + spotifyKeys.accessToken },
      json: true
    };

    return await request.get(options)
      .then((data) => {
        return data.tracks[0].id;
      })
      .catch((error) => {
        console.log(error);
      })
  }
}

module.exports = Spotify;
