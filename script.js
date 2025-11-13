// script.js
document.addEventListener('DOMContentLoaded', function() {
    // Tab functionality
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            // Update active tab button
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Show active tab content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');
                }
            });
        });
    });
    
    // Steganography functionality
    const imageInput = document.getElementById('imageInput');
    const secretMessage = document.getElementById('secretMessage');
    const stegPassword = document.getElementById('stegPassword');
    const encodeBtn = document.getElementById('encodeBtn');
    const decodeBtn = document.getElementById('decodeBtn');
    const stegResult = document.getElementById('stegResult');
    const stegOutput = document.getElementById('stegOutput');
    const stegCanvas = document.getElementById('stegCanvas');
    const downloadBtn = document.getElementById('downloadBtn');
    
    encodeBtn.addEventListener('click', encodeImage);
    decodeBtn.addEventListener('click', decodeImage);
    downloadBtn.addEventListener('click', downloadImage);
    
    function encodeImage() {
        if (!imageInput.files || !imageInput.files[0]) {
            showError(stegOutput, 'Please select an image file.');
            return;
        }
        
        if (!secretMessage.value.trim()) {
            showError(stegOutput, 'Please enter a secret message.');
            return;
        }
        
        const file = imageInput.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                // Set canvas dimensions to match image
                stegCanvas.width = img.width;
                stegCanvas.height = img.height;
                
                const ctx = stegCanvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                
                // Get image data
                const imageData = ctx.getImageData(0, 0, img.width, img.height);
                const data = imageData.data;
                
                // Prepare message with delimiter
                let message = secretMessage.value;
                if (stegPassword.value) {
                    message = xorEncrypt(message, stegPassword.value);
                }
                message += '¶'; // End of message delimiter
                
                // Convert message to binary
                const binaryMessage = textToBinary(message);
                
                // Check if message fits in image
                if (binaryMessage.length > data.length * 4) {
                    showError(stegOutput, 'Message is too long for this image. Try a shorter message or a larger image.');
                    return;
                }
                
                // Encode message in image
                let messageIndex = 0;
                for (let i = 0; i < data.length; i++) {
                    // Skip alpha channel for PNGs
                    if ((i + 1) % 4 === 0) continue;
                    
                    if (messageIndex < binaryMessage.length) {
                        // Replace LSB with message bit
                        data[i] = (data[i] & 0xFE) | parseInt(binaryMessage[messageIndex]);
                        messageIndex++;
                    } else {
                        break;
                    }
                }
                
                // Update image data
                ctx.putImageData(imageData, 0, 0);
                
                // Show result
                stegResult.classList.remove('hidden');
                stegCanvas.classList.remove('hidden');
                downloadBtn.classList.remove('hidden');
                stegOutput.innerHTML = '<p style="color: var(--success)">Message successfully encoded in image!</p>';
            };
            img.src = e.target.result;
        };
        
        reader.readAsDataURL(file);
    }
    
    function decodeImage() {
        if (!imageInput.files || !imageInput.files[0]) {
            showError(stegOutput, 'Please select an image file.');
            return;
        }
        
        const file = imageInput.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                // Set canvas dimensions to match image
                stegCanvas.width = img.width;
                stegCanvas.height = img.height;
                
                const ctx = stegCanvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                
                // Get image data
                const imageData = ctx.getImageData(0, 0, img.width, img.height);
                const data = imageData.data;
                
                // Extract LSBs
                let binaryMessage = '';
                for (let i = 0; i < data.length; i++) {
                    // Skip alpha channel for PNGs
                    if ((i + 1) % 4 === 0) continue;
                    
                    // Get LSB
                    binaryMessage += data[i] & 1;
                }
                
                // Convert binary to text
                let message = binaryToText(binaryMessage);
                
                // Check for end of message delimiter
                const delimiterIndex = message.indexOf('¶');
                if (delimiterIndex === -1) {
                    showError(stegOutput, 'No hidden message found or message is corrupted.');
                    return;
                }
                
                // Extract actual message
                message = message.substring(0, delimiterIndex);
                
                // Decrypt if password was used
                if (stegPassword.value) {
                    message = xorDecrypt(message, stegPassword.value);
                }
                
                // Show result
                stegResult.classList.remove('hidden');
                stegCanvas.classList.add('hidden');
                downloadBtn.classList.add('hidden');
                stegOutput.innerHTML = `<p>Decoded message: <strong>${message}</strong></p>`;
            };
            img.src = e.target.result;
        };
        
        reader.readAsDataURL(file);
    }
    
    function downloadImage() {
        const link = document.createElement('a');
        link.download = 'encoded_image.png';
        link.href = stegCanvas.toDataURL();
        link.click();
    }
    
    // Text encoding/decoding functionality
    const encodingType = document.getElementById('encodingType');
    const textInput = document.getElementById('textInput');
    const encodeTextBtn = document.getElementById('encodeTextBtn');
    const decodeTextBtn = document.getElementById('decodeTextBtn');
    const textResult = document.getElementById('textResult');
    const textOutput = document.getElementById('textOutput');
    const copyTextBtn = document.getElementById('copyTextBtn');
    
    encodeTextBtn.addEventListener('click', encodeText);
    decodeTextBtn.addEventListener('click', decodeText);
    copyTextBtn.addEventListener('click', copyTextToClipboard);
    
    function encodeText() {
        if (!textInput.value.trim()) {
            showError(textOutput, 'Please enter text to encode.');
            return;
        }
        
        const type = encodingType.value;
        let result;
        
        switch(type) {
            case 'base64':
                result = btoa(textInput.value);
                break;
            case 'hex':
                result = textToHex(textInput.value);
                break;
            case 'binary':
                result = textToBinary(textInput.value);
                break;
            case 'url':
                result = encodeURIComponent(textInput.value);
                break;
            default:
                result = 'Unsupported encoding type';
        }
        
        textResult.classList.remove('hidden');
        textOutput.innerHTML = `<p>Encoded text: <code>${result}</code></p>`;
    }
    
    function decodeText() {
        if (!textInput.value.trim()) {
            showError(textOutput, 'Please enter text to decode.');
            return;
        }
        
        const type = encodingType.value;
        let result;
        
        try {
            switch(type) {
                case 'base64':
                    result = atob(textInput.value);
                    break;
                case 'hex':
                    result = hexToText(textInput.value);
                    break;
                case 'binary':
                    result = binaryToText(textInput.value);
                    break;
                case 'url':
                    result = decodeURIComponent(textInput.value);
                    break;
                default:
                    result = 'Unsupported encoding type';
            }
            
            textResult.classList.remove('hidden');
            textOutput.innerHTML = `<p>Decoded text: <strong>${result}</strong></p>`;
        } catch (e) {
            showError(textOutput, 'Error decoding text. Please check if the input is valid.');
        }
    }
    
    function copyTextToClipboard() {
        const text = textOutput.querySelector('code') ? 
                     textOutput.querySelector('code').textContent : 
                     textOutput.querySelector('strong').textContent;
        
        navigator.clipboard.writeText(text).then(() => {
            const originalText = copyTextBtn.textContent;
            copyTextBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyTextBtn.textContent = originalText;
            }, 2000);
        });
    }
    
    // Cryptography functionality
    const cryptoType = document.getElementById('cryptoType');
    const cryptoKey = document.getElementById('cryptoKey');
    const cryptoInput = document.getElementById('cryptoInput');
    const encryptBtn = document.getElementById('encryptBtn');
    const decryptBtn = document.getElementById('decryptBtn');
    const cryptoResult = document.getElementById('cryptoResult');
    const cryptoOutput = document.getElementById('cryptoOutput');
    const copyCryptoBtn = document.getElementById('copyCryptoBtn');
    
    encryptBtn.addEventListener('click', encryptText);
    decryptBtn.addEventListener('click', decryptText);
    copyCryptoBtn.addEventListener('click', copyCryptoToClipboard);
    
    function encryptText() {
        if (!cryptoInput.value.trim()) {
            showError(cryptoOutput, 'Please enter text to encrypt.');
            return;
        }
        
        if (!cryptoKey.value.trim()) {
            showError(cryptoOutput, 'Please enter an encryption key.');
            return;
        }
        
        const type = cryptoType.value;
        let result;
        
        switch(type) {
            case 'caesar':
                result = caesarCipher(cryptoInput.value, parseInt(cryptoKey.value) || 3, true);
                break;
            case 'xor':
                result = xorEncrypt(cryptoInput.value, cryptoKey.value);
                break;
            case 'aes':
                result = simulateAES(cryptoInput.value, cryptoKey.value, true);
                break;
            default:
                result = 'Unsupported encryption algorithm';
        }
        
        cryptoResult.classList.remove('hidden');
        cryptoOutput.innerHTML = `<p>Encrypted text: <code>${result}</code></p>`;
    }
    
    function decryptText() {
        if (!cryptoInput.value.trim()) {
            showError(cryptoOutput, 'Please enter text to decrypt.');
            return;
        }
        
        if (!cryptoKey.value.trim()) {
            showError(cryptoOutput, 'Please enter a decryption key.');
            return;
        }
        
        const type = cryptoType.value;
        let result;
        
        switch(type) {
            case 'caesar':
                result = caesarCipher(cryptoInput.value, parseInt(cryptoKey.value) || 3, false);
                break;
            case 'xor':
                result = xorDecrypt(cryptoInput.value, cryptoKey.value);
                break;
            case 'aes':
                result = simulateAES(cryptoInput.value, cryptoKey.value, false);
                break;
            default:
                result = 'Unsupported encryption algorithm';
        }
        
        cryptoResult.classList.remove('hidden');
        cryptoOutput.innerHTML = `<p>Decrypted text: <strong>${result}</strong></p>`;
    }
    
    function copyCryptoToClipboard() {
        const text = cryptoOutput.querySelector('code') ? 
                     cryptoOutput.querySelector('code').textContent : 
                     cryptoOutput.querySelector('strong').textContent;
        
        navigator.clipboard.writeText(text).then(() => {
            const originalText = copyCryptoBtn.textContent;
            copyCryptoBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyCryptoBtn.textContent = originalText;
            }, 2000);
        });
    }
    
    // Utility functions
    function textToBinary(text) {
        return text.split('').map(char => {
            return char.charCodeAt(0).toString(2).padStart(8, '0');
        }).join('');
    }
    
    function binaryToText(binary) {
        let text = '';
        for (let i = 0; i < binary.length; i += 8) {
            const byte = binary.substring(i, i + 8);
            if (byte.length === 8) {
                text += String.fromCharCode(parseInt(byte, 2));
            }
        }
        return text;
    }
    
    function textToHex(text) {
        return text.split('').map(char => {
            return char.charCodeAt(0).toString(16).padStart(2, '0');
        }).join('');
    }
    
    function hexToText(hex) {
        let text = '';
        for (let i = 0; i < hex.length; i += 2) {
            const byte = hex.substring(i, i + 2);
            text += String.fromCharCode(parseInt(byte, 16));
        }
        return text;
    }
    
    function caesarCipher(text, shift, encrypt) {
        if (!encrypt) shift = -shift;
        
        return text.split('').map(char => {
            if (char.match(/[a-z]/i)) {
                const code = char.charCodeAt(0);
                const isUpperCase = char === char.toUpperCase();
                const base = isUpperCase ? 65 : 97;
                return String.fromCharCode(((code - base + shift + 26) % 26) + base);
            }
            return char;
        }).join('');
    }
    
    function xorEncrypt(text, key) {
        let result = '';
        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
            result += String.fromCharCode(charCode);
        }
        return btoa(result); // Base64 encode to make it readable
    }
    
    function xorDecrypt(text, key) {
        try {
            const decoded = atob(text);
            let result = '';
            for (let i = 0; i < decoded.length; i++) {
                const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
                result += String.fromCharCode(charCode);
            }
            return result;
        } catch (e) {
            return 'Error: Invalid encrypted text';
        }
    }
    
    function simulateAES(text, key, encrypt) {
        // Note: This is a simulation - not real AES encryption
        // In a real application, you would use the Web Crypto API
        if (encrypt) {
            return btoa(text.split('').reverse().join('') + key);
        } else {
            try {
                const decoded = atob(text);
                if (decoded.endsWith(key)) {
                    return decoded.substring(0, decoded.length - key.length).split('').reverse().join('');
                } else {
                    return 'Error: Incorrect key';
                }
            } catch (e) {
                return 'Error: Invalid encrypted text';
            }
        }
    }
    
    function showError(element, message) {
        element.innerHTML = `<p style="color: var(--error)">${message}</p>`;
        element.parentElement.classList.remove('hidden');
    }
});