package auth

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"io"
)

// encryptionKey derives a 32-byte AES key from the JWT_SECRET environment variable.
func encryptionKey() []byte {
	secret := jwtSecret()
	hash := sha256.Sum256(secret)
	return hash[:]
}

// EncryptAES encrypts plaintext using AES-GCM with a key derived from JWT_SECRET.
// Returns a base64-encoded ciphertext string.
func EncryptAES(plaintext string) (string, error) {
	if plaintext == "" {
		return "", nil
	}

	key := encryptionKey()
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonce := make([]byte, aesGCM.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	ciphertext := aesGCM.Seal(nonce, nonce, []byte(plaintext), nil)
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

// DecryptAES decrypts a base64-encoded AES-GCM ciphertext string.
func DecryptAES(ciphertext string) (string, error) {
	if ciphertext == "" {
		return "", nil
	}

	key := encryptionKey()
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	decoded, err := base64.StdEncoding.DecodeString(ciphertext)
	if err != nil {
		return "", err
	}

	nonceSize := aesGCM.NonceSize()
	if len(decoded) < nonceSize {
		return "", errors.New("ciphertext too short")
	}

	nonce, ciphertextBytes := decoded[:nonceSize], decoded[nonceSize:]
	plaintext, err := aesGCM.Open(nil, nonce, ciphertextBytes, nil)
	if err != nil {
		return "", err
	}

	return string(plaintext), nil
}
