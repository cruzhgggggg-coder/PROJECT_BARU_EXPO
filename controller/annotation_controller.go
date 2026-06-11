package controller

import (
	"fmt"

	"testing_go/models"
)

// ─────────────────────────────────────────────────────────────────────────────
//  ANNOTATION OCR — MULTI-PROVIDER VISION
// ─────────────────────────────────────────────────────────────────────────────

var annotationOCRPrompt = `Kamu adalah asisten pembaca dokumen akademik.
Di hadapanmu adalah foto halaman skripsi/tesis yang sudah dicoret-coret atau diberi anotasi oleh dosen pembimbing.
Tugasmu adalah membaca SEMUA catatan, coretan, tulisan tangan, garis bawah, dan anotasi yang ada di halaman ini.
Kembalikan daftar terstruktur dari setiap poin koreksi yang kamu temukan, dalam Bahasa Indonesia.
Format output:
- [Lokasi/halaman jika terlihat]: Deskripsi singkat isi koreksi

Jika tidak ada anotasi yang terbaca, tulis: "(Tidak ada anotasi yang terbaca di gambar ini)"`

// processAnnotationImage sends a saved image file to the configured AI Vision provider and returns OCR text.
// Uses the user's preferred model from AI Gateway (NVIDIA, OpenAI, Gemini, or Anthropic).
func processAnnotationImage(imagePath string, user *models.User) (string, error) {
	fmt.Printf("\033[35m[ANNOTATION OCR] Processing %s via AI Vision...\033[0m\n", imagePath)

	result, err := callAIVision(user, annotationOCRPrompt, "", imagePath)
	if err != nil {
		fmt.Printf("\033[31m[ANNOTATION OCR] Vision failed: %v\033[0m\n", err)
		return fmt.Sprintf("(OCR gagal: %v)", err), nil
	}

	fmt.Printf("\033[32m[ANNOTATION OCR] Done — %d chars extracted\033[0m\n", len(result))
	return result, nil
}
