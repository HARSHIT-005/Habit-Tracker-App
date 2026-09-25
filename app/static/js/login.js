const flipCard = document.getElementById('flipCard');
const toSignup = document.getElementById('tosignup');
const toSignin = document.getElementById('tosignin');

const signinform = document.getElementById('signinform')
const signupform = document.getElementById('signupform')


toSignup.addEventListener("click", (e) => {
    e.preventDefault()
    flipCard.classList.add("flipped")
})

toSignin.addEventListener("click", (e) => {
    e.preventDefault()
    flipCard.classList.remove("flipped")
})

signinform.addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = e.target;
    const email = form.email.value;
    const password = form.password.value;

    try {
        const response = await fetch('/login', {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        })
        const data = await response.json();

        if (!response.ok) {
            showToast("Login Failed", data.message || "Invalid credentials");
            signinform.classList.add('shake');
            setTimeout(() => {
                signinform.classList.remove('shake');
            }, 500);
        } else {
            localStorage.setItem('access_token', data.access_token);
            window.location.href = '/home';
        }
    } catch (error) {
        showToast("Error", "Something went wrong. Please try again.");
    }
})

signupform.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(signupform);

    try {
        const response = await fetch('/signup', {
            method: "POST",
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            showToast("Signup Successful", "Redirecting to home...", "success");
            localStorage.setItem('access_token', data.access_token);
            setTimeout(() => {
                window.location.href = '/home';
            }, 1000);
        } else {
            // Try to parse JSON error first, then fall back to text
            let errorMessage;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message;
            } catch (e) {
                errorMessage = await response.text();
            }
            showToast("Signup Failed", errorMessage || "Could not create account");
        }
    } catch (error) {
        showToast("Error", "Something went wrong. Please try again.");
    }
})



function showToast(title, message, type = 'error') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');

    toastMessage.textContent = title + ": " + message;

    if (type === 'success') {
        toast.classList.add('success');
    } else {
        toast.classList.remove('success');
    }

    toast.classList.remove('translate-x-full');

    setTimeout(() => {
        toast.classList.add('translate-x-full');
        // Remove success class after animation to reset state
        setTimeout(() => {
            toast.classList.remove('success');
        }, 300);
    }, 3000);
}


const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('passwordInput');

function setupPasswordToggle(toggleBtnId, inputId) {
    const toggleBtn = document.getElementById(toggleBtnId);
    const input = document.getElementById(inputId);

    if (toggleBtn && input) {
        toggleBtn.addEventListener('click', function (e) {
            // toggle the type attribute
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);

            // toggle the eye slash icon
            const icon = this.querySelector('i');
            if (type === 'password') {
                icon.classList.remove('bi-eye-slash');
                icon.classList.add('bi-eye');
            } else {
                icon.classList.remove('bi-eye');
                icon.classList.add('bi-eye-slash');
            }
        });
    }
}

setupPasswordToggle('togglePassword', 'passwordInput');
setupPasswordToggle('toggleSignupPassword', 'signupPasswordInput');
