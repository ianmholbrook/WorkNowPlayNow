import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL     = 'https://gdefxgmsablrlkuswcvl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkZWZ4Z21zYWJscmxrdXN3Y3ZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNDEzNzUsImV4cCI6MjA5MDcxNzM3NX0.KrdAyGVX0eCVUNX0UM36XmVWS2X9rtfKjkaVH-3rzrg';

window.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const statusNode     = document.getElementById('auth-status');
const signUpBtn      = document.getElementById('sign-up');
const loginBtn       = document.getElementById('login');
const signOutBtn     = document.getElementById('sign-out');
const authModal      = document.getElementById('auth-modal');
const authModalTitle = document.getElementById('auth-modal-title');
const authForm       = document.getElementById('auth-form');
const authSubmitBtn  = document.getElementById('auth-submit');
const googleBtn      = document.getElementById('google-auth');
const emailInput     = document.getElementById('email');
const passwordInput  = document.getElementById('password');
const modalClose     = document.querySelector('.auth-modal-close');

let isSignUp = true;

function updateUI(session) {
  const signedIn = Boolean(session?.user);
  if (statusNode) {
    statusNode.textContent = signedIn ? `Signed in as ${session.user.email}` : '';
  }
  if (signUpBtn)  signUpBtn.hidden  = signedIn;
  if (loginBtn)   loginBtn.hidden   = signedIn;
  if (signOutBtn) signOutBtn.hidden = !signedIn;
}

function openAuthModal(signUpMode = true) {
  isSignUp = signUpMode;
  if (authModalTitle) authModalTitle.textContent = signUpMode ? 'Sign Up' : 'Login';
  if (authSubmitBtn)  authSubmitBtn.textContent  = signUpMode ? 'Sign Up' : 'Login';
  if (authModal)      authModal.style.display    = 'block';
  if (emailInput)     emailInput.focus();
}

function closeAuthModal() {
  if (authModal) authModal.style.display = 'none';
  if (authForm)  authForm.reset();
}

async function signInWithGoogle() {
  const { error } = await window.supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/app.html` },
  });
  if (error && statusNode) statusNode.textContent = `Google sign-in error: ${error.message}`;
  closeAuthModal();
}

async function handleEmailAuth(event) {
  event.preventDefault();
  const email    = emailInput?.value.trim();
  const password = passwordInput?.value.trim();
  if (!email || !password) {
    if (statusNode) statusNode.textContent = 'Please fill in all fields';
    return;
  }
  try {
    const result = isSignUp
      ? await window.supabase.auth.signUp({ email, password })
      : await window.supabase.auth.signInWithPassword({ email, password });

    if (result.error) {
      if (statusNode) statusNode.textContent = `${isSignUp ? 'Sign up' : 'Login'} error: ${result.error.message}`;
    } else {
      closeAuthModal();
      if (!isSignUp && result.data.session) {
        window.location.replace('/app.html');
      }
      if (isSignUp && result.data.user && !result.data.session) {
        if (statusNode) statusNode.textContent = 'Check your email for a confirmation link';
      }
    }
  } catch (err) {
    if (statusNode) statusNode.textContent = `Authentication error: ${err.message}`;
  }
}

async function signOut() {
  await window.supabase.auth.signOut();
  updateUI(null);
  window.location.replace('/index.html');
}

async function initAuth() {
  try {
    const { data: sessionData } = await window.supabase.auth.getSession();
    const session = sessionData?.session ?? null;
    updateUI(session);

    window.supabase.auth.onAuthStateChange((_event, newSession) => {
      updateUI(newSession);
    });
  } catch (err) {
    if (statusNode) statusNode.textContent = `Auth initialization failed: ${err.message}`;
  }
}

signUpBtn?.addEventListener('click',  () => openAuthModal(true));
loginBtn?.addEventListener('click',   () => openAuthModal(false));
signOutBtn?.addEventListener('click', signOut);
modalClose?.addEventListener('click', closeAuthModal);
authForm?.addEventListener('submit',  handleEmailAuth);
googleBtn?.addEventListener('click',  signInWithGoogle);
authModal?.addEventListener('click',  e => { if (e.target === authModal) closeAuthModal(); });

initAuth();