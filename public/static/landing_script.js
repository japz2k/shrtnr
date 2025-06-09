document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded and landing_script.js running.');

    // Small script to update year dynamically
    const currentYearElement = document.getElementById('current-year');
    if (currentYearElement) {
        currentYearElement.textContent = new Date().getFullYear();
    } else {
        console.warn('Element with ID "current-year" not found.');
    }

    // Login Modal Functionality
    const loginModal = document.getElementById('login-modal');
    const loginModalTrigger = document.getElementById('login-modal-trigger');
    const landingLoginForm = document.getElementById('landing-login-form');
    const modalLoginError = document.getElementById('modal-login-error');
    const modalLoginSubmitButton = document.getElementById('modal-login-submit');
    let modalCloseButton = null;

    if (!loginModal) {
        console.error('CRITICAL: Login modal (ID "login-modal") not found. Modal functionality will not work.');
        return;
    }
    if (!loginModalTrigger) {
        console.warn('Login modal trigger (ID "login-modal-trigger") not found. Modal cannot be opened by its trigger.');
    }
    if (!landingLoginForm) {
        console.warn('Landing login form (ID "landing-login-form") not found.');
    }
    if (!modalLoginError) {
        console.warn('Modal login error display (ID "modal-login-error") not found.');
    }
    if (!modalLoginSubmitButton) {
        console.warn('Modal login submit button (ID "modal-login-submit") not found.');
    }

    modalCloseButton = loginModal.querySelector('.modal-close-button');
    if (!modalCloseButton) {
        console.warn('Modal close button (class ".modal-close-button" inside login-modal) not found.');
    }

    function openModal(event) { 
        if(event) event.preventDefault(); 
        if (signupModal) { 
            signupModal.classList.remove('modal-open');
        }
        if (loginModal) {
            loginModal.classList.add('modal-open'); 
            console.log('Login modal classList add modal-open');
            modalLoginError.style.display = 'none';
            landingLoginForm.reset();
        }
    }
    function closeModal() {
        if (loginModal) {
            loginModal.classList.remove('modal-open'); 
            console.log('Login modal classList remove modal-open');
        }
    }

    if (loginModalTrigger) {
        loginModalTrigger.addEventListener('click', function(event) {
            console.log('Login modal trigger clicked!', event);
            openModal(event); 
        });
    }
    if (modalCloseButton) {
        modalCloseButton.addEventListener('click', closeModal);
    }
    window.addEventListener('click', function(event) {
        if (event.target === loginModal) {
            closeModal();
        }
    });

    if (landingLoginForm) {
        landingLoginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            modalLoginError.style.display = 'none';
            modalLoginError.textContent = '';

            const email = document.getElementById('modal-email').value.trim();
            const password = document.getElementById('modal-password').value;
            const rememberMe = document.getElementById('modal-remember-me').checked;

            modalLoginSubmitButton.disabled = true;
            modalLoginSubmitButton.textContent = "Logging in...";

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({
                        username: email,
                        password: password
                    })
                });
                const data = await response.json();
                if (response.ok && data.access_token) {
                    if (rememberMe) {
                        localStorage.setItem('accessToken', data.access_token);
                    } else {
                        sessionStorage.setItem('accessToken', data.access_token);
                    }
                    window.location.href = '/dashboard';
                } else {
                    modalLoginError.style.display = 'block';
                    modalLoginError.textContent = data.detail || "An error occurred. Please try again later.";
                }
            } catch (err) {
                modalLoginError.style.display = 'block';
                modalLoginError.textContent = "An error occurred. Please try again later.";
            } finally {
                modalLoginSubmitButton.disabled = false;
                modalLoginSubmitButton.textContent = "Login";
            }
        });
    }

    // Sign Up Modal Functionality
    const signupModal = document.getElementById('signup-modal');
    const navSignupModalTrigger = document.getElementById('nav-signup-modal-trigger'); 

    function openSignupModal(e) {
        console.log('[SignupModal] Attempting to open. Current signupModal classes:', signupModal ? signupModal.classList : 'not found');
        if (e) e.preventDefault(); 
        if (loginModal && loginModal.style.display === 'block') {
            loginModal.style.display = 'none';
        }
        if (signupModal) { // Ensure signupModal exists
            console.log('[SignupModal] openSignupModal: signupModal found. Current classes:', signupModal.classList);
            signupModal.classList.add('modal-open');
            console.log('[SignupModal] openSignupModal: Added modal-open. New classes:', signupModal.classList);
            if (modalSignupError) modalSignupError.style.display = 'none';
            if (landingSignupForm) landingSignupForm.reset();
        } else {
            console.error('Signup modal not found when trying to open!');
        }
    }

    if (navSignupModalTrigger) {
        navSignupModalTrigger.addEventListener('click', openSignupModal);
    }

    const signupModalTrigger = document.getElementById('signup-modal-trigger');
    const landingSignupForm = document.getElementById('landing-signup-form');
    const modalSignupError = document.getElementById('modal-signup-error');
    const modalSignupSubmitButton = document.getElementById('modal-signup-submit');
    let signupModalCloseButton = null;

    if (!signupModal) {
        console.error('CRITICAL: Sign Up modal (ID "signup-modal") not found.');
    } else {
        signupModalCloseButton = signupModal.querySelector('.modal-close-button');
        console.log('[SignupModal] Close button found inside signupModal:', signupModalCloseButton);
    }

    if (signupModalTrigger) {
        signupModalTrigger.addEventListener('click', function(event) {
            if(event) event.preventDefault(); 
            if (loginModal) { 
                loginModal.classList.remove('modal-open'); 
            }
            if (signupModal) {
                signupModal.classList.add('modal-open');
            }
            if(modalSignupError) modalSignupError.style.display = 'none';
            if(landingSignupForm) landingSignupForm.reset();
        });
    }
    if (signupModalCloseButton) {
        console.log('[SignupModal] Adding click listener to signupModalCloseButton.');
        signupModalCloseButton.addEventListener('click', function() {
            console.log('[SignupModal] X button CLICKED.');
            if (signupModal) {
                console.log('[SignupModal] X button: Current classes BEFORE remove:', signupModal.classList);
                signupModal.classList.remove('modal-open');
                console.log('[SignupModal] X button: Current classes AFTER remove:', signupModal.classList);
            }
        });
    }
    if (navSignupModalTrigger) {
        navSignupModalTrigger.addEventListener('click', function(event) {
            if(event) event.preventDefault();
            if (loginModal) { 
                loginModal.classList.remove('modal-open'); 
            }
            if (signupModal) { 
                signupModal.classList.add('modal-open');
                if (modalSignupError) modalSignupError.style.display = 'none';
                if (landingSignupForm) landingSignupForm.reset();
            }
        });
    }

    window.addEventListener('click', function(event) {
        if (event.target === signupModal) {
            if (signupModal) {
                console.log('[SignupModal] Window click outside. Current classes BEFORE remove:', signupModal.classList);
                signupModal.classList.remove('modal-open');
                console.log('[SignupModal] Window click outside. Current classes AFTER remove:', signupModal.classList);
            }
        }
    });

    if (landingSignupForm) {
        landingSignupForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            modalSignupError.style.display = 'none';
            modalSignupError.textContent = '';

            const email = document.getElementById('signup-email').value.trim();
            const password = document.getElementById('signup-password').value;
            const confirmPassword = document.getElementById('signup-confirm-password').value;

            if (password !== confirmPassword) {
                modalSignupError.style.display = 'block';
                modalSignupError.textContent = "Passwords do not match.";
                return;
            }

            modalSignupSubmitButton.disabled = true;
            modalSignupSubmitButton.textContent = "Signing up...";

            try {
                const response = await fetch('/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await response.json();
                if (response.ok && data.access_token) {
                    localStorage.setItem('accessToken', data.access_token);
                    window.location.href = '/dashboard';
                } else {
                    modalSignupError.style.display = 'block';
                    modalSignupError.textContent = data.detail || "Sign up failed. Please try again.";
                }
            } catch (err) {
                modalSignupError.style.display = 'block';
                modalSignupError.textContent = "An error occurred. Please try again later.";
            } finally {
                modalSignupSubmitButton.disabled = false;
                modalSignupSubmitButton.textContent = "Sign Up";
            }
        });
    }
});
