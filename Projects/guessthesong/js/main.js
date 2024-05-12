const playButton = document.getElementById('playButton');
const skipButton = document.getElementById('skipButton');
const submitButton = document.getElementById('submitButton');

// Play button
playButton.addEventListener('click', function() {
    this.classList.add('pulse-animation');

    const audioPlayer = document.querySelector('audio');

    if (audioPlayer) {
        audioPlayer.play();
    }

    setTimeout(() => {
        this.classList.remove('pulse-animation');
    }, 850);
});

// Skip button
skipButton.addEventListener('click', function() {
    this.classList.add('pulse-animation_skip');
    
    setTimeout(() => {
        this.classList.remove('pulse-animation_skip');
    }, 850);
});

// Submit button
submitButton.addEventListener('click', function() {
    this.classList.add('pulse-animation_submit');
    
    setTimeout(() => {
        this.classList.remove('pulse-animation_submit');
    }, 850);
});

        async function getAccessToken() {
            const clientId = 'e53d2a0a504a4488800a5908036104b9';
            const clientSecret = '1ed609c44ec14bebbe8fcd6e3c26e897';
            
            const credentials = btoa(`${clientId}:${clientSecret}`);
            
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
            const playlistURI = '6hO1mHhLjoI3ukhNB5bOMD';
        
            try {
                const accessToken = await getAccessToken();
        
                const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistURI}/tracks?limit=50`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });
        
                const data = await response.json();
                console.log(data);
        
                // Filter out tracks with null preview_url
                const tracksWithPreview = data.items.filter(item => item.track.preview_url !== null);
        
                if (tracksWithPreview.length > 0) {
                    const randomIndex = Math.floor(Math.random() * tracksWithPreview.length);
                    const track = tracksWithPreview[randomIndex].track;
                    const previewUrl = track.preview_url;
        
                    const audioPlayer = document.createElement('audio');
                    //audioPlayer.controls = true;
                    audioPlayer.src = previewUrl;
                    console.log(previewUrl);
        
                    addPlayPauseEventListener(audioPlayer);
        
                    document.getElementById('song-preview').innerHTML = '';
                    document.getElementById('song-preview').appendChild(audioPlayer);
                } else {
                    document.getElementById('song-preview').innerHTML = 'No songs available in the playlist with preview URLs.';
                }
            } catch (error) {
                console.error('Error:', error);
            }
        }
      
      function addPlayPauseEventListener(audioPlayer) {
          let isPlaying = false;
          let timeinbetween = 1000;
          audioPlayer.addEventListener('play', function() {
              if (!isPlaying) {
                  setTimeout(function() {
                      audioPlayer.pause();
                      isPlaying = false;
                  }, timeinbetween);
                  timeinbetween += 3000;
                  isPlaying = true;
              }
          });
      }

    window.onload = playRandomSongFromPlaylist;