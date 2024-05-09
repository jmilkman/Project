const playButton = document.getElementById('playButton');

playButton.addEventListener('click', function() {
    // Add the 'pulse-animation' class
    this.classList.add('pulse-animation');

    // Get the audio element
    const audioPlayer = document.querySelector('audio');

    // Play the audio
    if (audioPlayer) {
        audioPlayer.play();
    }

    // Remove the 'pulse-animation' class after the animation completes
    setTimeout(() => {
        this.classList.remove('pulse-animation');
    }, 850); // Adjust this time to match the duration of your animation (1.3s = 1300ms)
});



        async function getAccessToken() {
            const clientId = 'e53d2a0a504a4488800a5908036104b9';
            const clientSecret = '1ed609c44ec14bebbe8fcd6e3c26e897';
            
            // Base64 encode the client ID and client secret
            const credentials = btoa(`${clientId}:${clientSecret}`);
            
            // Make a POST request to the Spotify token endpoint
            const response = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${credentials}`
                },
                body: 'grant_type=client_credentials'
            });
            
            const data = await response.json();
            const accessToken = data.access_token;
            
            return accessToken;
        }

        async function playRandomSongFromPlaylist() {
            const playlistURI = '6hO1mHhLjoI3ukhNB5bOMD'; // Replace with your playlist URI
        
            try {
                // Get the access token
                const accessToken = await getAccessToken();
        
                // Make a request to Spotify API to get the playlist details
                const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistURI}/tracks?limit=50`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });
        
                const data = await response.json();
                console.log(data);
        
                // Filter out tracks with null preview_url
                const tracksWithPreview = data.items.filter(item => item.track.preview_url !== null);
        
                // Check if there are any tracks with preview_url in the response
                if (tracksWithPreview.length > 0) {
                    // Randomly select a track from the filtered playlist
                    const randomIndex = Math.floor(Math.random() * tracksWithPreview.length);
                    const track = tracksWithPreview[randomIndex].track;
                    const previewUrl = track.preview_url;
        
                    // Display the song preview
                    const audioPlayer = document.createElement('audio');
                    //audioPlayer.controls = true;
                    audioPlayer.src = previewUrl;
                    console.log(previewUrl);
        
                    // Add play/pause event listener
                    addPlayPauseEventListener(audioPlayer);
        
                    document.getElementById('song-preview').innerHTML = '';
                    document.getElementById('song-preview').appendChild(audioPlayer);
                } else {
                    document.getElementById('song-preview').innerHTML = 'No songs available in the playlist with preview URLs.';
                }
            } catch (error) {
                console.error('Error:', error);
                document.getElementById('song-preview').innerHTML = 'Error fetching the playlist.';
            }
        }
        
      
      function addPlayPauseEventListener(audioPlayer) {
          let isPlaying = false;
          let timeinbetween = 1000;
          audioPlayer.addEventListener('play', function() {
              if (!isPlaying) {
                  // Start playing the audio
                  setTimeout(function() {
                      audioPlayer.pause();
                      isPlaying = false;
                  }, timeinbetween);
                  timeinbetween += 3000;
                  isPlaying = true;
              }
          });
      }


        // Call the function when the page loads
        window.onload = playRandomSongFromPlaylist;