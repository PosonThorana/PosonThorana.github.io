document.addEventListener('DOMContentLoaded', () => {
    // Get references to all necessary DOM elements
    const backgroundAudio = document.getElementById('background-story-audio');
    const videoElements = document.querySelectorAll('.video-player-wrapper video');
    const videoWrappers = document.querySelectorAll('.video-player-wrapper');

    // State variables for managing the automated sequence
    let currentStoryStep = 0; // Tracks the current step in the story sequence
    let playbackTimeout; // Stores the timeout ID for sequential video/audio playback
    let isAutoSequenceActive = false; // Flag to indicate if the automatic sequence is running
    let manualPlaybackVideoIndex = -1; // Stores the index of the video played manually by the user

    // Define the sequence of events (audio, video, duration)
    // IMPORTANT: Replace 'https://www.soundhelix.com/examples/mp3/...' and 'https://www.learningcontainer.com/...'
    // with your actual audio and video file URLs.
    // The 'duration' for 'playVideo' steps should ideally match the length of the video
    // or the desired focus time for that video before moving to the next step.
    const storySequence = [
        { type: 'audio', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', duration: 8000, text: 'Welcome to The Seven Weeks of Lord Buddha. Let us begin our journey.' }, // Intro audio
        { type: 'video', index: 0, src: 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4', audioSrc: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', duration: 5000, text: 'This is the first week, a time of profound enlightenment.' },
        { type: 'video', index: 1, src: 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4', audioSrc: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', duration: 7000, text: 'The second week brought deeper contemplation and peace.' },
        { type: 'video', index: 2, src: 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4', audioSrc: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', duration: 6000, text: 'During the third week, the path became clearer.' },
        { type: 'video', index: 3, src: 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4', audioSrc: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', duration: 8000, text: 'The fourth week saw great challenges and triumphs.' },
        { type: 'audio', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', duration: 10000, text: 'And so concludes our story of the Seven Weeks. Thank you for joining us.' } // Outro audio
    ];

    /**
     * Plays a given audio file.
     * @param {string} audioSrc - The URL of the audio file to play.
     * @param {function} [callback] - An optional callback function to execute when the audio finishes.
     */
    function playBackgroundAudio(audioSrc, callback) {
        backgroundAudio.src = audioSrc;
        backgroundAudio.play().catch(error => {
            console.error("Error playing background audio:", error);
            // If autoplay is blocked by the browser, try to play on user interaction later
            if (error.name === "NotAllowedError") {
                console.warn("Autoplay was prevented. User interaction might be needed to start audio.");
                // You might display a "Click to start" button here for the user to initiate playback
            }
        });
        backgroundAudio.onended = () => {
            if (callback) {
                callback();
            }
        };
    }

    /**
     * Stops all videos, resets their time, and removes focus/playing classes.
     */
    function stopAllVideos() {
        videoElements.forEach(video => {
            video.pause();
            video.currentTime = 0; // Reset video to start
            video.muted = true; // Ensure videos are muted when not focused
            video.parentElement.classList.remove('focused', 'playing');
        });
    }

    /**
     * Focuses on a specific video, plays it, and unmutes it.
     * Adds 'focused' and 'playing' classes for CSS styling.
     * @param {number} index - The index of the video to focus on.
     */
    function focusVideo(index) {
        stopAllVideos(); // Ensure only one video is active at a time
        const videoWrapper = videoWrappers[index];
        const video = videoElements[index];

        videoWrapper.classList.add('focused');
        videoWrapper.classList.add('playing'); // Mark as playing to hide overlay
        video.muted = false; // Unmute the focused video
        video.play().catch(error => {
            console.error(`Error playing video ${index}:`, error);
        });

        // Set up listener for when the video ends.
        // This 'onended' event will handle both auto-sequence progression and
        // resuming the auto-sequence after a manual user click.
        video.onended = () => {
            unfocusVideo(index); // Unfocus the current video
            // If the video that just ended was part of the automatic sequence (or was a manual playback
            // that should lead to resuming the auto sequence), proceed to the next step.
            if (isAutoSequenceActive || manualPlaybackVideoIndex === index) {
                if (manualPlaybackVideoIndex === index) {
                    manualPlaybackVideoIndex = -1; // Reset manual playback flag
                }
                startNextStoryStep(); // Resume auto sequence or continue to next step
            }
        };
    }

    /**
     * Unfocuses a video, pauses it, mutes it, and removes styling classes.
     * @param {number} index - The index of the video to unfocus.
     */
    function unfocusVideo(index) {
        const videoWrapper = videoWrappers[index];
        const video = videoElements[index];

        video.pause();
        video.muted = true; // Mute when unfocused
        video.currentTime = 0; // Reset video to start for next play
        videoWrapper.classList.remove('focused', 'playing');
    }

    /**
     * Advances to the next step in the story sequence.
     * Manages audio playback, video focus, and timers for the automatic flow.
     */
    function startNextStoryStep() {
        clearTimeout(playbackTimeout); // Clear any existing timeout before starting a new step

        if (currentStoryStep < storySequence.length) {
            isAutoSequenceActive = true; // Ensure the auto sequence flag is true
            const step = storySequence[currentStoryStep];
            console.log(`Starting step ${currentStoryStep}: ${step.text}`);

            if (step.type === 'audio') {
                playBackgroundAudio(step.src, () => {
                    // Audio finished, move to next step in the sequence
                    currentStoryStep++;
                    startNextStoryStep();
                });
            } else if (step.type === 'video') {
                // Play video-specific narration, then focus and play video
                playBackgroundAudio(step.audioSrc, () => {
                    focusVideo(step.index); // Focus the video
                    // Set a timeout to unfocus the video and proceed to the next step
                    // after its defined duration in the sequence.
                    playbackTimeout = setTimeout(() => {
                        // This block will execute if the video completes its auto-sequence duration
                        // before a user manually clicks another video.
                        unfocusVideo(step.index);
                        currentStoryStep++;
                        startNextStoryStep();
                    }, step.duration);
                });
            }
        } else {
            // Sequence completed
            isAutoSequenceActive = false; // The auto sequence has finished its cycle
            console.log("Story sequence completed. Waiting 30 seconds to restart.");
            // Set a timeout to restart the entire sequence after 30 seconds
            playbackTimeout = setTimeout(() => {
                currentStoryStep = 0; // Reset the sequence to the beginning
                startNextStoryStep(); // Restart the entire sequence
            }, 30000); // Wait 30 seconds (30000 milliseconds)
        }
    }

    // --- Event Listeners for User Interaction ---
    // Attach click listeners to each video wrapper for manual playback control
    videoWrappers.forEach((wrapper, index) => {
        wrapper.addEventListener('click', () => {
            console.log(`User clicked video ${index}`);
            // When a user clicks, interrupt any ongoing automatic sequence
            isAutoSequenceActive = false;
            clearTimeout(playbackTimeout); // Clear any pending auto-playback timeout
            manualPlaybackVideoIndex = index; // Mark this video as manually played

            // Focus and play the clicked video.
            // The video's 'onended' event listener (set in focusVideo function)
            // will handle unfocusing and resuming the automatic sequence (if desired)
            // or simply stopping after manual playback.
            focusVideo(index);
        });
    });

    // Initial call to start the experience when the page loads
    // Adding a small delay to ensure all DOM elements are rendered and
    // the browser has processed initial styling before starting media playback.
    setTimeout(() => {
        startNextStoryStep();
    }, 500); // 500ms delay before starting the auto sequence
});
