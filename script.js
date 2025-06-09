document.addEventListener('DOMContentLoaded', () => {
    // Get references to all necessary DOM elements
    const backgroundAudio = document.getElementById('background-story-audio');
    const videoElements = document.querySelectorAll('.video-player-wrapper video');
    const videoWrappers = document.querySelectorAll('.video-player-wrapper');
    const buddhaBulbBackground = document.getElementById('buddha-bulb-background');
    const outlineBulbContainers = document.querySelectorAll('.bulb-pattern-container.outline-bulbs');

    // State variables for managing the automated sequence
    let currentStoryStep = 0; // Tracks the current step in the story sequence
    let playbackTimeout; // Stores the timeout ID for sequential video/audio playback
    let isAutoSequenceActive = false; // Flag to indicate if the automatic sequence is running
    let manualPlaybackVideoIndex = -1; // Stores the index of the video played manually by the user

    // Define the sequence of events (audio, video, duration, bulbPattern)
    // IMPORTANT: Replace 'https://www.soundhelix.com/examples/mp3/...' and 'https://www.learningcontainer.com/...'
    // with your actual audio and video file URLs.
    // Ensure you have 7 videos for this version (indices 0-6).
    const storySequence = [
        { type: 'audio', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', duration: 8000, text: 'Welcome to The Seven Weeks of Lord Buddha. Let us begin our journey.' }, // Intro audio
        { type: 'bulbPattern', pattern: 0, duration: 2000, text: 'Observing the first pattern of lights.'}, // Trigger first bulb pattern
        { type: 'video', index: 0, src: 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4', audioSrc: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', duration: 5000, text: 'This is the first week, a time of profound enlightenment.' },
        { type: 'video', index: 1, src: 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4', audioSrc: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', duration: 7000, text: 'The second week brought deeper contemplation and peace.' },
        { type: 'bulbPattern', pattern: 1, duration: 2000, text: 'Transitioning to the second dazzling pattern.'}, // Trigger second bulb pattern
        { type: 'video', index: 2, src: 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4', audioSrc: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', duration: 6000, text: 'During the third week, the path became clearer.' },
        { type: 'video', index: 3, src: 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4', audioSrc: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', duration: 8000, text: 'The fourth week saw great challenges and triumphs.' },
        { type: 'bulbPattern', pattern: 2, duration: 2000, text: 'Now the third beautiful and calming pattern.'}, // Trigger third bulb pattern
        { type: 'video', index: 4, src: 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4', audioSrc: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', duration: 5000, text: 'The fifth week unfolded new perspectives.' },
        { type: 'video', index: 5, src: 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4', audioSrc: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', duration: 7000, text: 'The sixth week was a period of introspection.' },
        { type: 'video', index: 6, src: 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4', audioSrc: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', duration: 6000, text: 'Finally, the seventh week brought ultimate liberation.' },
        { type: 'audio', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', duration: 10000, text: 'And so concludes our story of the Seven Weeks. Thank you for joining us.' } // Outro audio
    ];

    // --- Dynamic Bulb Generation for Ellipse ---
    /**
     * Generates and appends dot elements to a container to cover an elliptical area.
     * @param {HTMLElement} container - The DOM element to append dots to.
     * @param {number} numDots - The number of dots to generate.
     * @param {number} dotSize - The size (width/height) of each dot.
     * @param {string} dotClass - The CSS class for the dots (e.g., 'dot-lg').
     */
    function generateEllipseBulbs(container, numDots, dotSize, dotClass) {
        container.innerHTML = ''; // Clear existing dots
        const containerWidth = container.offsetWidth;
        const containerHeight = container.offsetHeight;
        const centerX = containerWidth / 2;
        const centerY = containerHeight / 2;
        const radiusX = containerWidth / 2 - (dotSize / 2); // Adjust radius to keep dots within bounds
        const radiusY = containerHeight / 2 - (dotSize / 2);

        for (let i = 0; i < numDots; i++) {
            const dot = document.createElement('div');
            dot.classList.add(dotClass);
            // Distribute dots randomly within the ellipse
            const angle = Math.random() * 2 * Math.PI;
            const r = Math.sqrt(Math.random()); // Random radius from center to edge
            const x = centerX + radiusX * r * Math.cos(angle);
            const y = centerY + radiusY * r * Math.sin(angle);

            dot.style.left = `${x}px`;
            dot.style.top = `${y}px`;
            dot.style.width = `${dotSize}px`;
            dot.style.height = `${dotSize}px`;
            // Apply a random animation delay for a more natural look
            dot.style.animationDelay = `${Math.random() * 1.5}s`;
            container.appendChild(dot);
        }
    }

    /**
     * Generates and appends dot elements to a container to outline a rectangle.
     * @param {HTMLElement} container - The DOM element to append dots to.
     * @param {number} numDotsPerSide - The number of dots per side (approx).
     * @param {number} dotSize - The size (width/height) of each dot.
     */
    function generateOutlineBulbs(container, numDotsPerSide, dotSize) {
        container.innerHTML = ''; // Clear existing dots
        const rect = container.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        const addDotsOnSide = (start, end, fixedCoord, isXFixed, sideLength) => {
            for (let i = 0; i <= numDotsPerSide; i++) {
                const dot = document.createElement('div');
                dot.classList.add('dot');
                dot.style.width = `${dotSize}px`;
                dot.style.height = `${dotSize}px`;
                dot.style.animationDelay = `${Math.random() * 0.8}s`; // Shorter random delay
                if (isXFixed) {
                    dot.style.left = `${fixedCoord}px`;
                    dot.style.top = `${start + (end - start) * (i / numDotsPerSide)}px`;
                } else {
                    dot.style.top = `${fixedCoord}px`;
                    dot.style.left = `${start + (end - start) * (i / numDotsPerSide)}px`;
                }
                container.appendChild(dot);
            }
        };

        // Top edge
        addDotsOnSide(0, width - dotSize, 0, false, width);
        // Bottom edge
        addDotsOnSide(0, width - dotSize, height - dotSize, false, width);
        // Left edge (avoid corners to prevent overlap)
        addDotsOnSide(dotSize, height - dotSize, 0, true, height);
        // Right edge (avoid corners)
        addDotsOnSide(dotSize, height - dotSize, width - dotSize, true, height);
    }


    /**
     * Plays a given audio file.
     * @param {string} audioSrc - The URL of the audio file to play.
     * @param {function} [callback] - An optional callback function to execute when the audio finishes.
     */
    function playBackgroundAudio(audioSrc, callback) {
        backgroundAudio.src = audioSrc;
        backgroundAudio.play().catch(error => {
            console.error("Error playing background audio:", error);
            if (error.name === "NotAllowedError") {
                console.warn("Autoplay was prevented. User interaction might be needed to start audio.");
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

        video.onended = () => {
            unfocusVideo(index);
            if (isAutoSequenceActive || manualPlaybackVideoIndex === index) {
                if (manualPlaybackVideoIndex === index) {
                    manualPlaybackVideoIndex = -1;
                }
                startNextStoryStep();
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
     * Applies a specific bulb pattern by adding/removing CSS classes.
     * This function iterates through all bulb containers and applies the pattern class.
     * @param {number} patternNumber - The index of the pattern to apply (0, 1, or 2).
     */
    function applyBulbPattern(patternNumber) {
        // Apply pattern to ellipse bulbs
        buddhaBulbBackground.classList.remove('pattern-0', 'pattern-1', 'pattern-2');
        buddhaBulbBackground.classList.add(`pattern-${patternNumber}`);

        // Apply pattern to outline bulbs (for video rectangles)
        outlineBulbContainers.forEach(container => {
            container.classList.remove('pattern-0', 'pattern-1', 'pattern-2');
            container.classList.add(`pattern-${patternNumber}`);
        });

        console.log(`Bulb pattern changed to: pattern-${patternNumber}`);
    }

    /**
     * Advances to the next step in the story sequence.
     * Manages audio playback, video focus, bulb pattern changes, and timers for the automatic flow.
     */
    function startNextStoryStep() {
        clearTimeout(playbackTimeout); // Clear any existing timeout before starting a new step

        if (currentStoryStep < storySequence.length) {
            isAutoSequenceActive = true; // Ensure the auto sequence flag is true
            const step = storySequence[currentStoryStep];
            console.log(`Starting step ${currentStoryStep}: Type: ${step.type}, Text: ${step.text}`);

            if (step.type === 'audio') {
                playBackgroundAudio(step.src, () => {
                    currentStoryStep++;
                    startNextStoryStep();
                });
            } else if (step.type === 'video') {
                playBackgroundAudio(step.audioSrc, () => {
                    focusVideo(step.index);
                    playbackTimeout = setTimeout(() => {
                        unfocusVideo(step.index);
                        currentStoryStep++;
                        startNextStoryStep();
                    }, step.duration);
                });
            } else if (step.type === 'bulbPattern') {
                applyBulbPattern(step.pattern);
                playbackTimeout = setTimeout(() => {
                    currentStoryStep++;
                    startNextStoryStep();
                }, step.duration);
            }
        } else {
            isAutoSequenceActive = false;
            console.log("Story sequence completed. Waiting 30 seconds to restart.");
            playbackTimeout = setTimeout(() => {
                currentStoryStep = 0;
                startNextStoryStep();
            }, 30000);
        }
    }

    // --- Event Listeners for User Interaction ---
    videoWrappers.forEach((wrapper, index) => {
        wrapper.addEventListener('click', () => {
            console.log(`User clicked video ${index}`);
            isAutoSequenceActive = false;
            clearTimeout(playbackTimeout);
            manualPlaybackVideoIndex = index;
            focusVideo(index);
        });
    });

    // Generate bulbs when the DOM is fully loaded and elements are sized
    window.addEventListener('load', () => {
        // Generate bulbs for the central ellipse background
        generateEllipseBulbs(buddhaBulbBackground, 500, 10, 'dot-lg'); // 500 dots, 10px size

        // Generate bulbs for each video rectangle outline
        outlineBulbContainers.forEach(container => {
            generateOutlineBulbs(container, 15, 6); // 15 dots per side, 6px size
        });

        // Start the main story sequence
        startNextStoryStep();
    });
});
