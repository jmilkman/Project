const playButton = document.getElementById('playButton');
const skipButton = document.getElementById('skipButton');
const submitButton = document.getElementById('submitButton');

const openBtn = document.getElementById("openHelp");
const closeBtn = document.getElementById("closeHelp");
const help = document.getElementById("help");

const Answer = [];

openBtn.addEventListener("click", () => {
    help.style.visibility = "visible";
});

closeBtn.addEventListener("click", () => {
    help.style.visibility = "hidden";
});

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
                //console.log(data);
                const songList = [];
        
                const tracksWithPreview = data.items.filter(item => item.track.preview_url !== null);

        
                if (tracksWithPreview.length > 0) {
                    tracksWithPreview.forEach(item => {
                        const randomIndex = Math.floor(Math.random() * tracksWithPreview.length);
                        const track = tracksWithPreview[randomIndex].track;
                        const previewUrl = track.preview_url;
                        const trackName = track.name;
                        const artistNames = track.artists.map(artist => artist.name).join(', ');
                        
                        // Check if the song exists in the array.
                        const isDuplicate = songList.some(song => song.name === trackName && song.artistNames === artistNames);
                        
                        // Only add the trackname and artistsNames if its not a dup.
                        if (!isDuplicate) {
                            songList.push({ name: trackName, artistNames: artistNames });
                        }
                    });

                    const randomIndex = Math.floor(Math.random() * tracksWithPreview.length);
                    const track = tracksWithPreview[randomIndex].track;
                    const previewUrl = track.preview_url;
                    const trackName = track.name;
                    const artistNames = track.artists.map(artist => artist.name).join(', ');
        
                    const audioPlayer = document.createElement('audio');
                    audioPlayer.src = previewUrl;
        
                    Answer.push({ name: trackName, artistNames: artistNames });
        
                    //console.log("What the previewURL is: ", previewUrl);
                    //console.log("List of songs: ", songList);
                    console.log("Answer: ", Answer);
                    
                    listSongsOptions(songList);
                    addPlayPauseEventListener(audioPlayer);
        
                    document.getElementById('song-preview').innerHTML = '';
                    document.getElementById('song-preview').appendChild(audioPlayer);
                } else {
                    document.getElementById('song-preview').innerHTML = 'No songs available in the playlist with preview URLs.';
                }
            } catch (error) {
                console.error('Error:', error);
            }
            return Answer;
        }
        
      
    function addPlayPauseEventListener(audioPlayer) {
        let isPlaying = false;
        let timeinbetween = 1000;
        audioPlayer.addEventListener('play', function() {
        console.time("test_timer");
        if (!isPlaying) {
            setTimeout(function() {
            audioPlayer.pause();
            isPlaying = false;
            console.timeEnd("test_timer");
            }, timeinbetween);
            timeinbetween += 3000;
            isPlaying = true;
            }
        });
    }

    function listSongsOptions(songList) {
        // Get the datalist element
        const songListDatalist = document.getElementById('songList');

        // Clear previous options
        songListDatalist.innerHTML = '';

        // Populate options from songList array
        songList.forEach(song => {
            const option = document.createElement('option');
            option.value = `${song.name} - ${song.artistNames}`;
            songListDatalist.appendChild(option);
        });
    }

    let currentGuessBox = 1;

    function skip() {
        const guessBox = document.querySelector(`.guessbox${currentGuessBox} p`);
            
        guessBox.textContent = "Skipped";
        guessBox.classList.add('incorrect'); // Add the 'incorrect' class
    
        const iconSpan = document.createElement('span');
        iconSpan.classList.add('fa', 'fa-x'); // Add Font Awesome classes
        
        // Append the icon before the text content
        guessBox.insertBefore(iconSpan, guessBox.firstChild);
    
        currentGuessBox++;
    
        if (currentGuessBox > 5) {
            currentGuessBox = 1;
        }
    }

    function submit(guess) {
        const guessBox = document.querySelector(`.guessbox${currentGuessBox} p`);
        
        // Retrieve the correct answer from the Answer array
        const correctAnswer = Answer[0]; // Assuming the correct answer is the first element of the Answer array

        // Compare the user's guess with the correct answer
        if (guess === `${correctAnswer.name} - ${correctAnswer.artistNames}`) {
            guessBox.textContent = guess;
            guessBox.classList.add('correct'); // Add the 'correct' class

            const iconSpan = document.createElement('span');
            iconSpan.classList.add('fa', 'fa-check'); // Add Font Awesome classes
            
            // Append the icon before the text content
            guessBox.insertBefore(iconSpan, guessBox.firstChild);

        } else {
            guessBox.textContent = guess;
            guessBox.classList.remove('correct'); // Remove the 'correct' class if it was previously added
            guessBox.classList.add('incorrect'); // Add the 'incorrect' class

            const iconSpan = document.createElement('span');
            iconSpan.classList.add('fa', 'fa-x'); // Add Font Awesome classes
            
            // Append the icon before the text content
            guessBox.insertBefore(iconSpan, guessBox.firstChild);
        }
    
        currentGuessBox++;
    
        if (currentGuessBox > 5) {
            currentGuessBox = 1;
        }
        document.getElementById('guess').value = "";
    }
    
    window.onload = playRandomSongFromPlaylist;