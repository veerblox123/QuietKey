const encoder = new TextEncoder();
const decoder = new TextDecoder();
const messageInput = document.querySelector('#message');
const charCount = document.querySelector('#char-count');
const encryptResult = document.querySelector('#encrypt-result');
const decryptResult = document.querySelector('#decrypt-result');
const decryptError = document.querySelector('#decrypt-error');

function toBase64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function fromBase64Url(value) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('This does not look like a valid encrypted message.');
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - value.length % 4) % 4);
  const binary = atob(base64);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

async function makeKey() {
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  return { key, encoded: toBase64Url(new Uint8Array(await crypto.subtle.exportKey('raw', key))) };
}

function importKey(encoded) {
  const raw = fromBase64Url(encoded.trim());
  if (raw.byteLength !== 32) throw new Error('The key should be 43 characters long. Check that you copied the whole key.');
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['decrypt']);
}

function showToast(text) {
  const toast = document.querySelector('#toast');
  toast.textContent = text;
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 2200);
}

async function copyText(id) {
  const element = document.getElementById(id);
  try {
    await navigator.clipboard.writeText(element.value);
    showToast('Copied to clipboard');
  } catch {
    element.focus();
    element.select();
    document.execCommand('copy');
    showToast('Copied to clipboard');
  }
}

document.querySelector('#encrypt-tab').addEventListener('click', () => setTab('encrypt'));
document.querySelector('#decrypt-tab').addEventListener('click', () => setTab('decrypt'));
function setTab(tab) {
  const encrypting = tab === 'encrypt';
  document.querySelector('#encrypt-tab').classList.toggle('active', encrypting);
  document.querySelector('#decrypt-tab').classList.toggle('active', !encrypting);
  document.querySelector('#encrypt-tab').setAttribute('aria-selected', String(encrypting));
  document.querySelector('#decrypt-tab').setAttribute('aria-selected', String(!encrypting));
  document.querySelector('#encrypt-panel').classList.toggle('hidden', !encrypting);
  document.querySelector('#decrypt-panel').classList.toggle('hidden', encrypting);
}

messageInput.addEventListener('input', () => {
  charCount.textContent = `${messageInput.value.length.toLocaleString()} / 10,000`;
});

document.querySelector('#encrypt-button').addEventListener('click', async () => {
  const message = messageInput.value;
  if (!message.trim()) {
    messageInput.focus();
    showToast('Write a message first');
    return;
  }
  const button = document.querySelector('#encrypt-button');
  button.disabled = true;
  button.textContent = 'Encrypting…';
  try {
    const { key, encoded } = await makeKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(message));
    const payload = { v: 1, alg: 'AES-GCM', iv: toBase64Url(iv), data: toBase64Url(new Uint8Array(ciphertext)) };
    document.querySelector('#cipher-output').value = `QK1.${toBase64Url(encoder.encode(JSON.stringify(payload)))}`;
    document.querySelector('#key-output').value = encoded;
    document.querySelector('#key-output').type = 'password';
    document.querySelector('#toggle-key').textContent = '◉';
    encryptResult.classList.remove('hidden');
    encryptResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch {
    showToast('Encryption failed. Try a modern browser over HTTPS.');
  } finally {
    button.disabled = false;
    button.innerHTML = 'Encrypt message <span>→</span>';
  }
});

document.querySelector('#decrypt-button').addEventListener('click', async () => {
  const input = document.querySelector('#cipher-input').value.trim();
  const keyText = document.querySelector('#decrypt-key').value.trim();
  decryptResult.classList.add('hidden');
  decryptError.classList.add('hidden');
  try {
    if (!input.startsWith('QK1.')) throw new Error('This encrypted message is not in QuietKey format. Paste the complete message, including “QK1.”');
    if (!keyText) throw new Error('Enter the secret key that was created with this message.');
    const payload = JSON.parse(decoder.decode(fromBase64Url(input.slice(4))));
    if (payload.v !== 1 || payload.alg !== 'AES-GCM') throw new Error('This encrypted message uses an unsupported format.');
    const key = await importKey(keyText);
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64Url(payload.iv) }, key, fromBase64Url(payload.data));
    document.querySelector('#plain-output').value = decoder.decode(plaintext);
    decryptResult.classList.remove('hidden');
  } catch (error) {
    decryptError.textContent = error.name === 'OperationError'
      ? 'Could not unlock this message. The key may be wrong, or the encrypted message may have been changed.'
      : error.message || 'Could not read this message. Check the text and try again.';
    decryptError.classList.remove('hidden');
  }
});

document.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click', () => copyText(button.dataset.copy)));
document.querySelector('#toggle-key').addEventListener('click', () => {
  const field = document.querySelector('#key-output');
  const visible = field.type === 'password';
  field.type = visible ? 'text' : 'password';
  document.querySelector('#toggle-key').textContent = visible ? '⊘' : '◉';
});
document.querySelector('#download-button').addEventListener('click', () => {
  const content = `QuietKey encrypted message\n\nEncrypted message:\n${document.querySelector('#cipher-output').value}\n\nSecret key:\n${document.querySelector('#key-output').value}\n\nKeep the key private. Anyone with this key can decrypt the message.\n`;
  const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'quietkey-message.txt';
  link.click();
  URL.revokeObjectURL(url);
});

if (!window.crypto?.subtle) {
  document.querySelector('#encrypt-button').disabled = true;
  showToast('Secure encryption needs a modern browser and HTTPS or localhost.');
}
