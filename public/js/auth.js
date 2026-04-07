import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const statusNode = document.getElementById('auth-status');
const signUpBtn = document.getElementById('sign-up');
const loginBtn = document.getElementById('login');
const signOutBtn = document.getElementById('sign-out');
const authModal = document.getElementById('auth-modal');
const authModalTitle = document.getElementById('auth-modal-title');
const authForm = document.getElementById('auth-form');
const authSubmitBtn = document.getElementById('auth-submit');
const googleBtn = document.getElementById('google-auth');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const modalClose = document.querySelector('.auth-modal-close');

let isSignUp = true;

async function getConfig() {
  const response = await fetch('/auth/config');
  if (!response.ok) {
    throw new Error('Failed to load Supabase auth config');
  }
  return response.json();
}

function updateUI(session) {
  const signedIn = Boolean(session?.user);
  statusNode.textContent = signedIn
    ? `Signed in as ${session.user.email}`
    : 'Not signed in';

  signUpBtn.hidden = signedIn;
  loginBtn.hidden = signedIn;
  signOutBtn.hidden = !signedIn;
}

function openAuthModal(signUpMode = true) {
  isSignUp = signUpMode;
  authModalTitle.textContent = signUpMode ? 'Sign Up' : 'Login';
  authSubmitBtn.textContent = signUpMode ? 'Sign Up' : 'Login';
  authModal.style.display = 'block';
  emailInput.focus();
}

function closeAuthModal() {
  authModal.style.display = 'none';
  authForm.reset();
}

async function signInWithGoogle() {
  const { error } = await window.supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/app.html`,
    },
  });

  if (error) {
    statusNode.textContent = `Google sign-in error: ${error.message}`;
  }
  closeAuthModal();
}

async function handleEmailAuth(event) {
  event.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    statusNode.textContent = 'Please fill in all fields';
    return;
  }

  try {
    let result;
    if (isSignUp) {
      result = await window.supabase.auth.signUp({
        email,
        password,
      });
    } else {
      result = await window.supabase.auth.signInWithPassword({
        email,
        password,
      });
    }

    if (result.error) {
      statusNode.textContent = `${isSignUp ? 'Sign up' : 'Login'} error: ${result.error.message}`;
    } else {
      closeAuthModal();
      if (isSignUp && result.data.user && !result.data.session) {
        statusNode.textContent = 'Check your email for confirmation link';
      }
    }
  } catch (error) {
    statusNode.textContent = `Authentication error: ${error.message}`;
  }
}

async function signOut() {
  const { error } = await window.supabase.auth.signOut();
  if (error) {
    statusNode.textContent = `Sign-out error: ${error.message}`;
  } else {
    updateUI(null);
  }
}

async function initAuth() {
  try {
    const config = await getConfig();
    if (!config.url || !config.anonKey) {
      throw new Error('Missing Supabase URL or anon key in environment variables');
    }

    window.supabase = createClient(config.url, config.anonKey);

    const { data: sessionData } = await window.supabase.auth.getSession();
    const session = sessionData?.session;
    updateUI(session);

    if (session?.user && (window.location.pathname === '/' || window.location.pathname === '/index.html')) {
      window.location.href = '/app.html';
      return;
    }

    window.supabase.auth.onAuthStateChange((_event, newSession) => {
      updateUI(newSession);
    });
  } catch (error) {
    statusNode.textContent = `Auth initialization failed: ${error.message}`;
  }
}

signUpBtn?.addEventListener('click', () => openAuthModal(true));
loginBtn?.addEventListener('click', () => openAuthModal(false));
signOutBtn?.addEventListener('click', signOut);
modalClose?.addEventListener('click', closeAuthModal);
authForm?.addEventListener('submit', handleEmailAuth);
googleBtn?.addEventListener('click', signInWithGoogle);

// Close modal when clicking outside
authModal?.addEventListener('click', (event) => {
  if (event.target === authModal) {
    closeAuthModal();
  }
});

initAuth();
