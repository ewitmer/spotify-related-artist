var unirest = require('unirest');
var express = require('express');
var events = require('events');
var fetch = require('node-fetch');  


var getFromApi = function(endpoint, args) {
    var emitter = new events.EventEmitter();
    unirest.get('https://api.spotify.com/v1/' + endpoint)
           .qs(args)
           .end(function(response) {
                if (response.ok) {
                    emitter.emit('end', response.body);
                }
                else {
                    emitter.emit('error', response.code);
                }
            });
    return emitter;
};


var app = express();
app.use(express.static('public'));

app.get('/search/:name', function(req, res) {
    var searchReq = getFromApi('search', {
        q: req.params.name,
        limit: 1,
        type: 'artist'
    });

    searchReq.on('end', function(item) {
        var artist = item.artists.items[0].id;
        var newEndPoint = "https://api.spotify.com/v1/artists/"+artist+"/related-artists";
        var relatedArtistArray = [];

        fetch(newEndPoint)
        .then(function(response) {
            return response.json();
        }).then(function(body) {
            body.artists.forEach(function(element){
                relatedArtistArray.push({
                    'name': element.name,
                    'id': element.id,
                    'topTracks': []
                });
            });
        }).then(function(body){
            console.log(relatedArtistArray);
            return getTopTracks(relatedArtistArray);
        }).then(function(response){
            console.log('done after get related artists');
            console.log(response);
            res.json('done');                
        })
    });

    searchReq.on('error', function(code) {
        res.sendStatus(code);
    });

});


function getTopTracks(artistArray) {
    
    var totalArtists = 0;

    artistArray.forEach(function(artist){
        var topTracksEndPoint = "https://api.spotify.com/v1/artists/"+artist.id+"/top-tracks?country=US";
        fetch(topTracksEndPoint)
        .then(function(response) {
            return response.json();
        }).then(function(body) {
            body.tracks.forEach(function(track){
                artist.topTracks.push(track.name);
            })
        }).then(function(body) {
            totalArtists ++;
            console.log(totalArtists)
            if (totalArtists === artistArray.length) {
                console.log('this works!')
                console.log(artistArray)    
                return artistArray;
            }
        });
    });
};



app.listen(process.env.PORT || 3000);