package controller

import (
	"encoding/json"
	"errors"
	"fmt"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"testing_go/auth"
	"testing_go/koneksi"
	"testing_go/middleware"
	"testing_go/models"
	"testing_go/realtime"
	"testing_go/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

var WebSocketHub *realtime.Hub

func SetRealtimeHub(hub *realtime.Hub) {
	WebSocketHub = hub
}

// validateUploadedFile checks file extension whitelist and max size
func validateUploadedFile(file *multipart.FileHeader, allowedExts []string, maxSize int64) error {
	if file.Size > maxSize {
		return fmt.Errorf("file size exceeds maximum allowed (%d MB)", maxSize/(1024*1024))
	}
	ext := strings.ToLower(filepath.Ext(file.Filename))
	for _, allowed := range allowedExts {
		if ext == allowed {
			return nil
		}
	}
	return fmt.Errorf("file type '%s' is not allowed", ext)
}

// encryptUserKeys encrypts all API key fields before database storage.
func encryptUserKeys(user *models.User) {
	keys := []struct {
		name string
		val  string
		ptr  *string
	}{
		{"OpenAIKey", user.OpenAIKey, &user.OpenAIKey},
		{"GeminiKey", user.GeminiKey, &user.GeminiKey},
		{"AnthropicKey", user.AnthropicKey, &user.AnthropicKey},
		{"NvidiaKey", user.NvidiaKey, &user.NvidiaKey},
		{"GroqKey", user.GroqKey, &user.GroqKey},
	}
	for _, k := range keys {
		if k.val == "" {
			continue
		}
		encrypted, err := auth.EncryptAES(k.val)
		if err != nil {
			fmt.Printf("[ENCRYPT] Warning: failed to encrypt %s: %v\n", k.name, err)
			continue
		}
		*k.ptr = encrypted
	}
}

// decryptUserKeys decrypts all API key fields after database read.
func decryptUserKeys(user *models.User) {
	keys := []struct {
		name string
		val  string
		ptr  *string
	}{
		{"OpenAIKey", user.OpenAIKey, &user.OpenAIKey},
		{"GeminiKey", user.GeminiKey, &user.GeminiKey},
		{"AnthropicKey", user.AnthropicKey, &user.AnthropicKey},
		{"NvidiaKey", user.NvidiaKey, &user.NvidiaKey},
		{"GroqKey", user.GroqKey, &user.GroqKey},
	}
	for _, k := range keys {
		if k.val == "" {
			continue
		}
		decrypted, err := auth.DecryptAES(k.val)
		if err != nil {
			fmt.Printf("[DECRYPT] Warning: failed to decrypt %s: %v\n", k.name, err)
			continue
		}
		*k.ptr = decrypted
	}
}

func maskKey(key string) string {
	if key == "" {
		return ""
	}
	return "••••••••••••••••"
}

func sanitizeUser(user *models.User) gin.H {
	// Decrypt API keys before returning in response
	decrypted := *user
	decryptUserKeys(&decrypted)

	response := gin.H{
		"id":                decrypted.ID,
		"name":              decrypted.Name,
		"email":             decrypted.Email,
		"role":              decrypted.Role,
		"preferred_model":   decrypted.PreferredModel,
		"is_gateway_active": decrypted.IsGatewayActive,
		"created_at":        decrypted.CreatedAt,
		"updated_at":        decrypted.UpdatedAt,
		"openai_key":        maskKey(decrypted.OpenAIKey),
		"gemini_key":        maskKey(decrypted.GeminiKey),
		"anthropic_key":     maskKey(decrypted.AnthropicKey),
		"nvidia_key":        maskKey(decrypted.NvidiaKey),
		"groq_key":          maskKey(decrypted.GroqKey),
	}

	if decrypted.Student != nil {
		response["student"] = decrypted.Student
	}
	if decrypted.Lecturer != nil {
		response["lecturer"] = decrypted.Lecturer
	}

	return response
}

func persistRefreshToken(c *gin.Context, userID uint64, refreshToken string, expiresAt time.Time) error {
	record := models.RefreshToken{
		UserID:    userID,
		TokenHash: auth.HashRefreshToken(refreshToken),
		ExpiresAt: expiresAt,
		UserAgent: c.GetHeader("User-Agent"),
		IPAddress: c.ClientIP(),
	}
	return koneksi.DB.Create(&record).Error
}

func authResponse(c *gin.Context, user *models.User) {
	bundle, refreshToken, refreshExpiry, err := auth.TokenBundle(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if err := persistRefreshToken(c, user.ID, refreshToken, refreshExpiry); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user":          sanitizeUser(user),
		"access_token":  bundle["access_token"],
		"token_type":    bundle["token_type"],
		"expires_at":    bundle["expires_at"],
		"refresh_token": refreshToken,
	})
}

func Register(c *gin.Context) {
	var req struct {
		Name         string          `json:"name" binding:"required"`
		Email        string          `json:"email" binding:"required,email"`
		Password     string          `json:"password" binding:"required,min=8"`
		Role         models.UserRole `json:"role" binding:"required"`
		NIM          string          `json:"nim"`
		Prodi        string          `json:"prodi"`
		ThesisTitle  string          `json:"thesis_title"`
		LecturerID   uint64          `json:"lecturer_id"`
		NIP          string          `json:"nip"`
		Faculty      string          `json:"faculty"`
		Keahlian     string          `json:"keahlian"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Role != models.RoleStudent && req.Role != models.RoleLecturer {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Role must be student or lecturer"})
		return
	}
	if req.Role == models.RoleStudent && (req.NIM == "" || req.LecturerID == 0) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Student requires a NIM and lecturer_id"})
		return
	}
	if req.Role == models.RoleLecturer && req.NIP == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Lecturer requires a NIP"})
		return
	}

	hashedPassword, err := auth.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	user := models.User{
		Name:     req.Name,
		Email:    strings.ToLower(strings.TrimSpace(req.Email)),
		Password: hashedPassword,
		Role:     req.Role,
	}

	if err := koneksi.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&user).Error; err != nil {
			return err
		}

		switch req.Role {
		case models.RoleStudent:
			student := models.Student{
				UserID:      user.ID,
				LecturerID:  req.LecturerID,
				NIM:         req.NIM,
				Name:        req.Name,
				Prodi:       req.Prodi,
				ThesisTitle: req.ThesisTitle,
			}
			if err := tx.Create(&student).Error; err != nil {
				return err
			}
			user.Student = &student
		case models.RoleLecturer:
			lecturer := models.Lecturer{
				UserID:   user.ID,
				NIP:      req.NIP,
				Name:     req.Name,
				Faculty:  req.Faculty,
				Keahlian: req.Keahlian,
			}
			if err := tx.Create(&lecturer).Error; err != nil {
				return err
			}
			user.Lecturer = &lecturer
		}

		return nil
	}); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	authResponse(c, &user)
}

func Login(c *gin.Context) {
	var req struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := koneksi.DB.Preload("Student").Preload("Lecturer").Where("email = ?", strings.ToLower(strings.TrimSpace(req.Email))).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Incorrect email or password"})
		return
	}

	if !auth.ComparePassword(user.Password, req.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Incorrect email or password"})
		return
	}

	authResponse(c, &user)
}

func Refresh(c *gin.Context) {
	var req struct {
		RefreshToken string `json:"refresh_token" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tokenHash := auth.HashRefreshToken(req.RefreshToken)
	var session models.RefreshToken
	if err := koneksi.DB.Where("token_hash = ?", tokenHash).First(&session).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid refresh token"})
		return
	}

	if session.RevokedAt != nil || time.Now().After(session.ExpiresAt) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Refresh token has expired or has been revoked"})
		return
	}

	now := time.Now()
	session.RevokedAt = &now
	_ = koneksi.DB.Save(&session).Error

	var user models.User
	if err := koneksi.DB.Preload("Student").Preload("Lecturer").First(&user, session.UserID).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	authResponse(c, &user)
}

func Logout(c *gin.Context) {
	var req struct {
		RefreshToken string `json:"refresh_token" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tokenHash := auth.HashRefreshToken(req.RefreshToken)
	now := time.Now()
	koneksi.DB.Model(&models.RefreshToken{}).
		Where("token_hash = ? AND revoked_at IS NULL", tokenHash).
		Update("revoked_at", &now)

	c.JSON(http.StatusOK, gin.H{"message": "Logout successful"})
}

func Me(c *gin.Context) {
	user := middleware.CurrentUser(c)
	c.JSON(http.StatusOK, gin.H{"user": sanitizeUser(user)})
}

func UpdateProfile(c *gin.Context) {
	user := middleware.CurrentUser(c)

	var req struct {
		Name          string `json:"name" binding:"required"`
		Email         string `json:"email" binding:"required,email"`
		NIM           string `json:"nim"`
		Prodi         string `json:"prodi"`
		ThesisTitle   string `json:"thesis_title"`
		LecturerID    uint64 `json:"lecturer_id"`
		NIP           string `json:"nip"`
		Faculty       string `json:"faculty"`
		Keahlian      string `json:"keahlian"`
		AiConstraints string `json:"ai_constraints"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user.Name = req.Name
	user.Email = strings.ToLower(strings.TrimSpace(req.Email))
	if err := koneksi.DB.Save(user).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	switch user.Role {
	case models.RoleStudent:
		var student models.Student
		if err := koneksi.DB.Where("user_id = ?", user.ID).First(&student).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Student profile not found"})
			return
		}
		student.Name = req.Name
		if req.NIM != "" {
			student.NIM = req.NIM
		}
		if req.LecturerID != 0 {
			student.LecturerID = req.LecturerID
		}
		student.Prodi = req.Prodi
		student.ThesisTitle = req.ThesisTitle
		if err := koneksi.DB.Save(&student).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		user.Student = &student
	case models.RoleLecturer:
		var lecturer models.Lecturer
		if err := koneksi.DB.Where("user_id = ?", user.ID).First(&lecturer).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Lecturer profile not found"})
			return
		}
		lecturer.Name = req.Name
		if req.NIP != "" {
			lecturer.NIP = req.NIP
		}
		lecturer.Faculty = req.Faculty
		lecturer.Keahlian = req.Keahlian
		lecturer.AiConstraints = req.AiConstraints
		if err := koneksi.DB.Save(&lecturer).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		user.Lecturer = &lecturer
	}

	c.JSON(http.StatusOK, gin.H{"message": "Profile updated successfully", "user": sanitizeUser(user)})
}

func UpdatePassword(c *gin.Context) {
	user := middleware.CurrentUser(c)

	var req struct {
		CurrentPassword string `json:"current_password" binding:"required"`
		Password        string `json:"password" binding:"required,min=8"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if !auth.ComparePassword(user.Password, req.CurrentPassword) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Current password does not match"})
		return
	}

	hashedPassword, err := auth.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	user.Password = hashedPassword
	if err := koneksi.DB.Save(user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password updated successfully"})
}

func UpdateAIGatewaySettingsV2(c *gin.Context) {
	user := middleware.CurrentUser(c)

	var req struct {
		OpenAIKey      string `json:"openai_key"`
		GeminiKey      string `json:"gemini_key"`
		AnthropicKey   string `json:"anthropic_key"`
		NvidiaKey      string `json:"nvidia_key"`
		GroqKey        string `json:"groq_key"`
		PreferredModel string `json:"preferred_model"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Decrypt existing keys so we have the plaintext versions
	decryptUserKeys(user)

	if req.OpenAIKey != "••••••••••••••••" {
		user.OpenAIKey = req.OpenAIKey
	}
	if req.GeminiKey != "••••••••••••••••" {
		user.GeminiKey = req.GeminiKey
	}
	if req.AnthropicKey != "••••••••••••••••" {
		user.AnthropicKey = req.AnthropicKey
	}
	if req.NvidiaKey != "••••••••••••••••" {
		user.NvidiaKey = req.NvidiaKey
	}
	if req.GroqKey != "••••••••••••••••" {
		user.GroqKey = req.GroqKey
	}
	if req.PreferredModel != "" {
		user.PreferredModel = req.PreferredModel
	}

	// Encrypt API keys before storing to database
	encryptUserKeys(user)

	if err := koneksi.DB.Save(user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "AI Gateway settings updated successfully", "user": sanitizeUser(user)})
}

func RedeemGatewayCodeV2(c *gin.Context) {
	user := middleware.CurrentUser(c)

	var req struct {
		Code string `json:"code" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var redeemCode models.RedeemCode
	if err := koneksi.DB.Where("code = ? AND is_used = ?", req.Code, false).First(&redeemCode).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Redeem code is invalid or has already been used"})
		return
	}

	redeemCode.IsUsed = true
	redeemCode.UsedBy = &user.ID
	user.IsGatewayActive = true

	if err := koneksi.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(&redeemCode).Error; err != nil {
			return err
		}
		return tx.Save(user).Error
	}); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "AI Gateway activated successfully", "user": sanitizeUser(user)})
}

func queryScopeForUser(query *gorm.DB, user *models.User) *gorm.DB {
	switch user.Role {
	case models.RoleStudent:
		return query.Joins("JOIN students ON students.id = consultation_logs.student_id").Where("students.user_id = ?", user.ID)
	case models.RoleLecturer:
		return query.Joins("JOIN students ON students.id = consultation_logs.student_id").Where("students.lecturer_id = ?", user.Lecturer.ID)
	default:
		return query
	}
}

func DashboardStatsV2(c *gin.Context) {
	user := middleware.CurrentUser(c)

	type statsResult struct {
		TotalLogs       int64
		TotalFeedback   int64
		MajorFeedback   int64
		PendingFeedback int64
	}

	var result statsResult

	logQuery := queryScopeForUser(koneksi.DB.Model(&models.ConsultationLog{}), user)
	logQuery.Count(&result.TotalLogs)

	feedbackBase := queryScopeForUser(
		koneksi.DB.Model(&models.FeedbackItem{}).Joins("JOIN consultation_logs ON consultation_logs.id = feedback_items.log_id"),
		user,
	)
	feedbackBase.Count(&result.TotalFeedback)

	if result.TotalFeedback > 0 {
		koneksi.DB.Model(&models.FeedbackItem{}).
			Joins("JOIN consultation_logs ON consultation_logs.id = feedback_items.log_id").
			Scopes(func(db *gorm.DB) *gorm.DB { return queryScopeForUser(db, user) }).
			Where("feedback_items.category = ?", models.CategoryMajor).
			Count(&result.MajorFeedback)

		koneksi.DB.Model(&models.FeedbackItem{}).
			Joins("JOIN consultation_logs ON consultation_logs.id = feedback_items.log_id").
			Scopes(func(db *gorm.DB) *gorm.DB { return queryScopeForUser(db, user) }).
			Where("feedback_items.status = ?", models.StatusPending).
			Count(&result.PendingFeedback)
	}

	var quests []models.FeedbackItem
	queryScopeForUser(
		koneksi.DB.Model(&models.FeedbackItem{}).Joins("JOIN consultation_logs ON consultation_logs.id = feedback_items.log_id"),
		user,
	).Where("feedback_items.status != ?", models.StatusValidated).Order("feedback_items.created_at desc").Limit(5).Find(&quests)

	completionRate := 0
	if result.TotalFeedback > 0 {
		completionRate = int(((result.TotalFeedback - result.PendingFeedback) * 100) / result.TotalFeedback)
	}

	response := gin.H{
		"total_consultations": result.TotalLogs,
		"total_feedback":      result.TotalFeedback,
		"pending_feedback":    result.PendingFeedback,
		"major_feedback":      result.MajorFeedback,
		"completion_rate":     completionRate,
		"draft_count":         result.TotalLogs,
		"upcoming_quests":     quests,
	}

	if user.Role == models.RoleStudent && user.Student != nil {
		var lecturer models.Lecturer
		if err := koneksi.DB.First(&lecturer, user.Student.LecturerID).Error; err == nil {
			response["lecturer_name"] = lecturer.Name
		}
	}
	if user.Role == models.RoleLecturer && user.Lecturer != nil {
		var studentCount int64
		koneksi.DB.Model(&models.Student{}).Where("lecturer_id = ?", user.Lecturer.ID).Count(&studentCount)
		response["student_count"] = studentCount
		response["validation_queue"] = result.PendingFeedback
	}

	c.JSON(http.StatusOK, response)
}

func accessibleLog(user *models.User, logID uint64) (*models.ConsultationLog, error) {
	var log models.ConsultationLog
	query := koneksi.DB

	switch user.Role {
	case models.RoleStudent:
		query = query.Joins("JOIN students ON students.id = consultation_logs.student_id").Where("consultation_logs.id = ? AND students.user_id = ?", logID, user.ID)
	case models.RoleLecturer:
		query = query.Joins("JOIN students ON students.id = consultation_logs.student_id").Where("consultation_logs.id = ? AND students.lecturer_id = ?", logID, user.Lecturer.ID)
	default:
		return nil, errors.New("unsupported role")
	}

	if err := query.First(&log).Error; err != nil {
		return nil, err
	}

	koneksi.DB.Where("log_id = ?", log.ID).Find(&log.FeedbackItems)
	if len(log.FeedbackItems) > 0 {
		ids := make([]uint64, len(log.FeedbackItems))
		for i, fi := range log.FeedbackItems {
			ids[i] = fi.ID
		}
		var comments []models.FeedbackComment
		koneksi.DB.Where("feedback_item_id IN ?", ids).Find(&comments)
		commentMap := make(map[uint64][]models.FeedbackComment)
		for _, c := range comments {
			commentMap[c.FeedbackItemID] = append(commentMap[c.FeedbackItemID], c)
		}
		for i := range log.FeedbackItems {
			log.FeedbackItems[i].Comments = commentMap[log.FeedbackItems[i].ID]
		}
	}
	koneksi.DB.Where("user_id = ?", log.StudentID).First(&log.Student)
	if log.Student != nil {
		koneksi.DB.Where("id = ?", log.Student.UserID).First(&log.Student.User)
		koneksi.DB.Where("id = ?", log.Student.LecturerID).First(&log.Student.Lecturer)
	}

	return &log, nil
}

// accessibleLogLight returns only the log metadata without heavy preloads
func accessibleLogLight(user *models.User, logID uint64) (*models.ConsultationLog, error) {
	var log models.ConsultationLog
	query := koneksi.DB

	switch user.Role {
	case models.RoleStudent:
		query = query.Joins("JOIN students ON students.id = consultation_logs.student_id").Where("consultation_logs.id = ? AND students.user_id = ?", logID, user.ID)
	case models.RoleLecturer:
		query = query.Joins("JOIN students ON students.id = consultation_logs.student_id").Where("consultation_logs.id = ? AND students.lecturer_id = ?", logID, user.Lecturer.ID)
	default:
		return nil, errors.New("unsupported role")
	}

	if err := query.First(&log).Error; err != nil {
		return nil, err
	}
	return &log, nil
}

func ConsultationListV2(c *gin.Context) {
	user := middleware.CurrentUser(c)
	var logs []models.ConsultationLog

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	query := queryScopeForUser(
		koneksi.DB.
			Preload("FeedbackItems").
			Preload("FeedbackItems.Comments").
			Preload("RevisionAnnotations").
			Preload("Student").
			Preload("Student.User").
			Preload("Student.Lecturer"),
		user,
	)

	var total int64
	query.Model(&models.ConsultationLog{}).Count(&total)

	if err := query.Order("consultation_logs.created_at desc").Offset(offset).Limit(limit).Find(&logs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":        logs,
		"page":        page,
		"limit":       limit,
		"total":       total,
		"total_pages": (total + int64(limit) - 1) / int64(limit),
	})
}

func ArchiveListV2(c *gin.Context) {
	ConsultationListV2(c)
}

func CreateConsultationV2(c *gin.Context) {
	user := middleware.CurrentUser(c)
	if user.Role != models.RoleStudent {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only students can create consultations"})
		return
	}

	var student models.Student
	if err := koneksi.DB.Where("user_id = ?", user.ID).First(&student).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Student profile not found"})
		return
	}

	audioFile, err := c.FormFile("audio")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Audio file is required"})
		return
	}

	// Validate audio file
	if err := validateUploadedFile(audioFile, []string{".mp3", ".wav", ".m4a", ".ogg", ".webm"}, 100*1024*1024); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Audio file invalid: %v", err)})
		return
	}

	paperFile, err := c.FormFile("paper")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Paper file (.docx) is required"})
		return
	}

	// Validate paper file
	if err := validateUploadedFile(paperFile, []string{".docx"}, 50*1024*1024); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Paper file invalid: %v", err)})
		return
	}

	timestamp := time.Now().UnixNano()
	audioFilename := fmt.Sprintf("%d_%s", timestamp, audioFile.Filename)
	audioPath := filepath.Join("storage", "audio", audioFilename)
	if err := c.SaveUploadedFile(audioFile, audioPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save audio file"})
		return
	}

	paperFilename := fmt.Sprintf("%d_%s", timestamp, paperFile.Filename)
	paperPath := filepath.Join("storage", "paper", paperFilename)
	if err := c.SaveUploadedFile(paperFile, paperPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save paper file"})
		return
	}

	paperText, err := utils.ReadDocxText(paperPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to extract text from docx: " + err.Error()})
		return
	}

	var prevLog models.ConsultationLog
	var prevFeedbackStr string
	if err := koneksi.DB.Preload("FeedbackItems").Where("student_id = ?", student.ID).Order("created_at desc").First(&prevLog).Error; err == nil {
		var feedbackLines []string
		for _, item := range prevLog.FeedbackItems {
			feedbackLines = append(feedbackLines, fmt.Sprintf("- [%s] %s", item.Category, item.Content))
		}
		prevFeedbackStr = strings.Join(feedbackLines, "\n")
	}

	// ── Process annotation files (optional) ───────────────────────────────────
	var annotationSummary string
	extractedTexts := make(map[string]string) // cache extracted text to avoid double API calls
	if form, formErr := c.MultipartForm(); formErr == nil && len(form.File["annotations"]) > 0 {
		annotationFiles := form.File["annotations"]
		if os.Getenv("GIN_MODE") != "release" {
			fmt.Printf("[ANNOTATION] Found %d annotation file(s) — saving & extracting...\n", len(annotationFiles))
		}
		imageExts := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".webp": true, ".gif": true}
		var summaryParts []string
		for i, fh := range annotationFiles {
			ext := strings.ToLower(filepath.Ext(fh.Filename))
			filename := fmt.Sprintf("%d_annotation_%d%s", timestamp, i+1, ext)
			savePath := filepath.Join("storage", "annotations", filename)
			if err := c.SaveUploadedFile(fh, savePath); err != nil {
				continue
			}
			var extractedText string
			if imageExts[ext] {
				extractedText, _ = processAnnotationImage(savePath, user)
			} else if ext == ".docx" {
				extractedText, _ = utils.ExtractDocxTrackChanges(savePath)
			} else {
				continue
			}
			extractedTexts[filename] = extractedText // cache for DB save step
			label := fmt.Sprintf("[Anotasi %d — %s]", i+1, fh.Filename)
			summaryParts = append(summaryParts, label+"\n"+extractedText)
		}
		if len(summaryParts) > 0 {
			annotationSummary = strings.Join(summaryParts, "\n\n---\n\n")
			prevFeedbackStr = prevFeedbackStr + "\n\nANOTASI REVISI DOSEN:\n" + annotationSummary
		}
	}

	feedbackItems, transcriptContent, err := AnalyzeAudioAndPaper(user.ID, audioPath, paperText, prevFeedbackStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "AI Processing failed: " + err.Error()})
		return
	}

	transcriptFilename := fmt.Sprintf("%d_transcript.txt", timestamp)
	transcriptPath := filepath.Join("storage", "transcript", transcriptFilename)
	_ = os.WriteFile(transcriptPath, []byte(transcriptContent), 0644)

	log := models.ConsultationLog{
		StudentID:          student.ID,
		AudioFilename:      audioFilename,
		TranscriptFilename: transcriptFilename,
		TranscriptText:     transcriptContent,
		PaperFilename:      paperFilename,
		FeedbackItems:      feedbackItems,
	}

	if err := koneksi.DB.Create(&log).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error: " + err.Error()})
		return
	}

	// ── Save annotation records linked to the new log (reuse cached text) ─────
	if annotationSummary != "" {
		if form, formErr := c.MultipartForm(); formErr == nil {
			annotationFiles := form.File["annotations"]
			imageExts := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".webp": true, ".gif": true}
			for i, fh := range annotationFiles {
				ext := strings.ToLower(filepath.Ext(fh.Filename))
				filename := fmt.Sprintf("%d_annotation_%d%s", timestamp, i+1, ext)
				var fileType models.AnnotationFileType
				if imageExts[ext] {
					fileType = models.AnnotationImage
				} else if ext == ".docx" {
					fileType = models.AnnotationDocx
				} else {
					continue
				}
				// Reuse cached extracted text — no second API call
				extractedText := extractedTexts[filename]
				ann := models.RevisionAnnotation{
					ConsultationLogID: log.ID,
					Filename:          filename,
					FileType:          fileType,
					ExtractedText:     extractedText,
				}
				koneksi.DB.Create(&ann)
			}
		}
	}

	log.Student = &student
	c.JSON(http.StatusCreated, gin.H{"message": "Consultation created successfully", "data": log})
}

func ConsultationChatV2(c *gin.Context) {
	user := middleware.CurrentUser(c)
	var req struct {
		LogID uint64 `json:"log_id" binding:"required"`
		Query string `json:"query" binding:"required"`
		Model string `json:"model"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	log, err := accessibleLog(user, req.LogID)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied or consultation log not found"})
		return
	}

	// 1. Save user query to database
	userMsg := models.AIChatMessage{
		LogID:   log.ID,
		Role:    "user",
		Content: req.Query,
	}
	koneksi.DB.Create(&userMsg)

	if WebSocketHub != nil {
		WebSocketHub.Broadcast("consultation."+strconv.FormatUint(req.LogID, 10), "chat.message", gin.H{
			"id":         userMsg.ID,
			"log_id":     req.LogID,
			"role":       "user",
			"content":    req.Query,
			"created_at": userMsg.CreatedAt,
		})
	}

	response, err := GenerateRevisionAssistance(req.LogID, req.Query, req.Model)
	if err != nil {
		if strings.HasPrefix(err.Error(), "GUARDED:") {
			c.JSON(http.StatusForbidden, gin.H{"status": "guarded", "message": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 2. Save AI response to database
	aiMsg := models.AIChatMessage{
		LogID:   log.ID,
		Role:    "ai",
		Content: response,
	}
	koneksi.DB.Create(&aiMsg)

	if WebSocketHub != nil {
		WebSocketHub.Broadcast("consultation."+strconv.FormatUint(req.LogID, 10), "chat.message", gin.H{
			"id":         aiMsg.ID,
			"log_id":     req.LogID,
			"role":       "ai",
			"content":    response,
			"created_at": aiMsg.CreatedAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "ai_response": response})
}

// GetAIChats fetches all persistent AI chats for a given log ID.
func GetAIChats(c *gin.Context) {
	user := middleware.CurrentUser(c)
	logIDStr := c.Param("id")
	logID, err := strconv.ParseUint(logIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid log ID"})
		return
	}

	log, err := accessibleLogLight(user, logID)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	var messages []models.AIChatMessage
	if err := koneksi.DB.Where("log_id = ?", log.ID).Order("created_at asc").Find(&messages).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": messages})
}

func UpdateFeedbackStatusV2(c *gin.Context) {
	user := middleware.CurrentUser(c)
	id := c.Param("id")

	var req struct {
		Status       string `json:"status" binding:"required"`
		LogID        uint64 `json:"log_id"`
		FixProofText string `json:"fix_proof_text"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	switch user.Role {
	case models.RoleStudent:
		if req.Status != string(models.StatusFixed) && req.Status != string(models.StatusPending) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Students can only change status to Pending or Fixed"})
			return
		}
	case models.RoleLecturer:
		if req.Status != string(models.StatusValidated) && req.Status != string(models.StatusPending) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Lecturers can only validate (Validated) or return status to Pending"})
			return
		}
	default:
		c.JSON(http.StatusForbidden, gin.H{"error": "Unknown role"})
		return
	}

	var feedback models.FeedbackItem
	if err := koneksi.DB.First(&feedback, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Feedback item not found"})
		return
	}

	log, err := accessibleLog(user, feedback.ConsultationLogID)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	feedback.Status = models.FeedbackStatus(req.Status)
	if req.Status == string(models.StatusFixed) && req.FixProofText != "" {
		feedback.FixProofText = req.FixProofText
	}
	if err := koneksi.DB.Save(&feedback).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	payload := gin.H{
		"feedback_id":      feedback.ID,
		"log_id":           feedback.ConsultationLogID,
		"consultation_log_id": feedback.ConsultationLogID,
		"status":           feedback.Status,
		"updated_by_role":  user.Role,
	}

	if WebSocketHub != nil {
		WebSocketHub.Broadcast("consultation."+strconv.FormatUint(log.ID, 10), "feedback.status-updated", payload)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Feedback status updated successfully", "data": payload})
}

func LecturerConsultationsV2(c *gin.Context) {
	user := middleware.CurrentUser(c)
	if user.Role != models.RoleLecturer || user.Lecturer == nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only lecturers can access this data"})
		return
	}

	var logs []models.ConsultationLog
	if err := koneksi.DB.Preload("FeedbackItems").Preload("FeedbackItems.Comments").Preload("Student").Preload("Student.User").
		Joins("JOIN students ON students.id = consultation_logs.student_id").
		Where("students.lecturer_id = ?", user.Lecturer.ID).
		Order("consultation_logs.created_at desc").
		Find(&logs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": logs})
}

func LecturerStudentsV2(c *gin.Context) {
	user := middleware.CurrentUser(c)
	if user.Role != models.RoleLecturer || user.Lecturer == nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only lecturers can access this data"})
		return
	}

	var students []models.Student
	if err := koneksi.DB.Preload("User").Where("lecturer_id = ?", user.Lecturer.ID).Find(&students).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": students})
}

// LecturerAddFeedbackV2 allows a lecturer to manually add a feedback item
// to a specific consultation log that belongs to one of their supervised students.
func LecturerAddFeedbackV2(c *gin.Context) {
	user := middleware.CurrentUser(c)
	if user.Role != models.RoleLecturer || user.Lecturer == nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only lecturers can dispatch feedback"})
		return
	}

	logIDStr := c.Param("id")
	logID, err := strconv.ParseUint(logIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid log ID"})
		return
	}

	var req struct {
		Content  string `json:"content" binding:"required"`
		Category string `json:"category"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Ensure the log belongs to a student supervised by this lecturer
	log, err := accessibleLog(user, logID)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied or consultation log not found"})
		return
	}

	// Default manually added feedback to "Major" (HOC) initially.
	// The student will run their AI Oracle to classify it properly.
	category := string(models.CategoryMajor)

	feedback := models.FeedbackItem{
		ConsultationLogID: log.ID,
		Content:           req.Content,
		Category:          models.FeedbackCategory(category),
		Status:            models.StatusPending,
	}
	if err := koneksi.DB.Create(&feedback).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Broadcast to real-time subscribers — use dedicated "feedback.new" event
	// so clients can APPEND the item instead of trying to mutate a non-existent one.
	if WebSocketHub != nil {
		WebSocketHub.Broadcast("consultation."+strconv.FormatUint(log.ID, 10), "feedback.new", gin.H{
			"id":                   feedback.ID,
			"feedback_id":          feedback.ID,
			"log_id":               feedback.ConsultationLogID,
			"consultation_log_id":  feedback.ConsultationLogID,
			"content":              feedback.Content,
			"status":               feedback.Status,
			"category":             feedback.Category,
			"created_at":           feedback.CreatedAt,
			"updated_by_role":      user.Role,
		})
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Feedback dispatched successfully", "data": feedback})
}

// AddFeedbackComment allows a student or lecturer to add a comment to a specific feedback item.
func AddFeedbackComment(c *gin.Context) {
	user := middleware.CurrentUser(c)
	feedbackIDStr := c.Param("id")
	feedbackID, err := strconv.ParseUint(feedbackIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid feedback ID"})
		return
	}

	var req struct {
		Content string `json:"content" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify the feedback item exists and the user has access
	var feedback models.FeedbackItem
	if err := koneksi.DB.First(&feedback, feedbackID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Feedback item not found"})
		return
	}

	// Verify access via the parent consultation log
	if _, err := accessibleLog(user, feedback.ConsultationLogID); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	authorRole := string(user.Role)
	comment := models.FeedbackComment{
		FeedbackItemID: feedbackID,
		AuthorID:       user.ID,
		AuthorRole:     authorRole,
		Content:        req.Content,
	}

	if err := koneksi.DB.Create(&comment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Broadcast to real-time subscribers
	if WebSocketHub != nil {
		WebSocketHub.Broadcast("consultation."+strconv.FormatUint(feedback.ConsultationLogID, 10), "feedback.comment", gin.H{
			"id":              comment.ID,
			"feedback_id":     comment.FeedbackItemID,
			"log_id":          feedback.ConsultationLogID,
			"author_id":       comment.AuthorID,
			"author_role":     comment.AuthorRole,
			"content":         comment.Content,
			"created_at":      comment.CreatedAt,
		})
	}

	c.JSON(http.StatusCreated, gin.H{"data": comment})
}

// UploadFinalDocument allows a student to upload the final approved document for a consultation log.
func UploadFinalDocument(c *gin.Context) {
	user := middleware.CurrentUser(c)
	if user.Role != models.RoleStudent || user.Student == nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only students can upload final documents"})
		return
	}

	logIDStr := c.Param("id")
	logID, err := strconv.ParseUint(logIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid log ID"})
		return
	}

	// Verify the log belongs to this student
	log, err := accessibleLog(user, logID)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied or consultation log not found"})
		return
	}

	file, err := c.FormFile("final_document")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}

	// Save file
	filename := fmt.Sprintf("final_%d_%s", logID, file.Filename)
	savePath := filepath.Join("storage", "final", filename)
	if err := c.SaveUploadedFile(file, savePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	// Update the consultation log record
	now := time.Now()
	if err := koneksi.DB.Model(log).Updates(map[string]interface{}{
		"final_document_filename":   filename,
		"final_document_uploaded_at": now,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	log.FinalDocumentFilename = filename
	log.FinalDocumentUploadedAt = &now

	c.JSON(http.StatusOK, gin.H{"message": "Final document uploaded successfully", "data": log})
}

// UploadRevisedDocument allows a student to upload a revised draft document for a consultation session.
func UploadRevisedDocument(c *gin.Context) {
	user := middleware.CurrentUser(c)
	if user.Role != models.RoleStudent || user.Student == nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only students can upload revised documents"})
		return
	}

	logIDStr := c.Param("id")
	logID, err := strconv.ParseUint(logIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid log ID"})
		return
	}

	// Verify the log belongs to this student
	log, err := accessibleLog(user, logID)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied or consultation log not found"})
		return
	}

	file, err := c.FormFile("revised_document")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}

	// Save file
	filename := fmt.Sprintf("revised_%d_%s", logID, file.Filename)
	savePath := filepath.Join("storage", "revised", filename)
	if err := c.SaveUploadedFile(file, savePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	// Update the consultation log record
	now := time.Now()
	if err := koneksi.DB.Model(log).Updates(map[string]interface{}{
		"revised_document_filename":    filename,
		"revised_document_uploaded_at": now,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	log.RevisedDocumentFilename = filename
	log.RevisedDocumentUploadedAt = &now

	c.JSON(http.StatusOK, gin.H{"message": "Revised document uploaded successfully", "data": log})
}

// GetDirectMessages fetches all direct messages for a given consultation log ID.
func GetDirectMessages(c *gin.Context) {
	user := middleware.CurrentUser(c)
	logIDStr := c.Param("id")
	logID, err := strconv.ParseUint(logIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid log ID"})
		return
	}

	// Verify accessibility (log belongs to student or supervisor)
	log, err := accessibleLogLight(user, logID)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	var messages []models.DirectMessage
	if err := koneksi.DB.Where("log_id = ?", log.ID).Order("created_at asc").Find(&messages).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": messages})
}

// SendDirectMessage saves a new direct message to the database and broadcasts it via WebSocket.
func SendDirectMessage(c *gin.Context) {
	user := middleware.CurrentUser(c)
	logIDStr := c.Param("id")
	logID, err := strconv.ParseUint(logIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid log ID"})
		return
	}

	// Verify accessibility
	log, err := accessibleLogLight(user, logID)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	var req struct {
		Content string `json:"content" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	msg := models.DirectMessage{
		LogID:      log.ID,
		SenderID:   user.ID,
		SenderRole: string(user.Role),
		Content:    req.Content,
	}

	if err := koneksi.DB.Create(&msg).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Broadcast via WebSocket
	if WebSocketHub != nil {
		WebSocketHub.Broadcast("consultation."+strconv.FormatUint(log.ID, 10), "chat.direct-message", gin.H{
			"id":          msg.ID,
			"log_id":      msg.LogID,
			"sender_id":   msg.SenderID,
			"sender_role": msg.SenderRole,
			"content":     msg.Content,
			"created_at":  msg.CreatedAt,
		})
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Message sent successfully", "data": msg})
}

// extractJSONBounds returns the tightest JSON substring found in input.
// It prefers a leading '{' object, otherwise a leading '[' array.
func extractJSONBounds(input string) string {
	input = strings.TrimSpace(input)
	// Strip common markdown code fences
	for _, fence := range []string{"```json", "```JSON", "```"} {
		if strings.HasPrefix(input, fence) {
			input = strings.TrimPrefix(input, fence)
			if idx := strings.LastIndex(input, "```"); idx != -1 {
				input = input[:idx]
			}
			input = strings.TrimSpace(input)
			break
		}
	}

	firstBrace := strings.Index(input, "{")
	firstBracket := strings.Index(input, "[")

	start := -1
	var closing string
	if firstBrace != -1 && (firstBracket == -1 || firstBrace < firstBracket) {
		start = firstBrace
		closing = "}"
	} else if firstBracket != -1 {
		start = firstBracket
		closing = "]"
	}

	if start == -1 {
		return input
	}

	end := strings.LastIndex(input, closing)
	if end == -1 || end < start {
		return input
	}
	return input[start : end+1]
}

// Kept for backward compatibility — some call sites still use the old name.
func extractJSONString(input string) string { return extractJSONBounds(input) }

// ClassifyFeedbackV2 uses the student's own API key to classify all raw feedback items
// for a consultation log into HOC (Major) and LOC (Minor).
func ClassifyFeedbackV2(c *gin.Context) {
	user := middleware.CurrentUser(c)
	if user.Role != models.RoleStudent {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only students can initiate AI classification"})
		return
	}

	logIDStr := c.Param("id")
	logID, err := strconv.ParseUint(logIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid log ID"})
		return
	}

	// Verify accessibility
	log, err := accessibleLog(user, logID)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	if len(log.FeedbackItems) == 0 {
		c.JSON(http.StatusOK, gin.H{"message": "No feedback items to classify", "data": log.FeedbackItems})
		return
	}

	// Build the item list for the AI
	type classificationInput struct {
		ID      uint64 `json:"id"`
		Content string `json:"content"`
	}
	var inputItems []classificationInput
	for _, item := range log.FeedbackItems {
		inputItems = append(inputItems, classificationInput{ID: item.ID, Content: item.Content})
	}
	itemsData, _ := json.Marshal(inputItems)

	// NOTE: json_object mode forces the model to return an OBJECT ({}), not a bare array ([]).
	// We therefore ask for {"items": [...]} which every model can produce reliably.
	systemPrompt := `You are an expert academic writing advisor.

Your task: classify each feedback item below as either "Major" or "Minor".
- "Major" (HOC – Higher Order Concerns): core substance — research structure, arguments, methodology, analysis, research model, thesis title.
- "Minor" (LOC – Lower Order Concerns): surface-level — formatting, typos, citation style, bibliography, spacing, spelling, grammar.

Return ONLY valid JSON in this exact shape — no explanation, no markdown, no extra text:
{"items":[{"id":1,"category":"Major"},{"id":2,"category":"Minor"}]}`

	userPrompt := fmt.Sprintf("Classify the following feedback items:\n%s", string(itemsData))

	// Decrypt API keys before using
	decryptUserKeys(user)

	aiResponse, err := callAI(user, systemPrompt, userPrompt, true)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "AI classification failed: " + err.Error()})
		return
	}

	// Print raw response in terminal for debugging
	if os.Getenv("GIN_MODE") != "release" {
		fmt.Printf("[AI CLASSIFICATION] Raw response received (%d chars)\n", len(aiResponse))
	}

	// Strip markdown fences and find JSON boundaries
	cleanedResponse := extractJSONBounds(aiResponse)
	if os.Getenv("GIN_MODE") != "release" {
		fmt.Printf("[AI CLASSIFICATION] Cleaned response: %d chars\n", len(cleanedResponse))
	}

	type ClassificationItem struct {
		ID       uint64 `json:"id"`
		Category string `json:"category"`
	}

	var finalClassifications []ClassificationItem

	// ── Attempt 1: {"items": [...]} — the shape we asked for
	{
		var wrapper struct {
			Items           []ClassificationItem `json:"items"`
			Classifications []ClassificationItem `json:"classifications"`
			Feedbacks       []ClassificationItem `json:"feedbacks"`
			Data            []ClassificationItem `json:"data"`
			Results         []ClassificationItem `json:"results"`
		}
		if err := json.Unmarshal([]byte(cleanedResponse), &wrapper); err == nil {
			switch {
			case len(wrapper.Items) > 0:
				finalClassifications = wrapper.Items
				goto SAVE_TO_DB
			case len(wrapper.Classifications) > 0:
				finalClassifications = wrapper.Classifications
				goto SAVE_TO_DB
			case len(wrapper.Feedbacks) > 0:
				finalClassifications = wrapper.Feedbacks
				goto SAVE_TO_DB
			case len(wrapper.Data) > 0:
				finalClassifications = wrapper.Data
				goto SAVE_TO_DB
			case len(wrapper.Results) > 0:
				finalClassifications = wrapper.Results
				goto SAVE_TO_DB
			}
		}
	}

	// ── Attempt 2: bare array [{"id":1,"category":"Major"}, ...]
	if err := json.Unmarshal([]byte(cleanedResponse), &finalClassifications); err == nil && len(finalClassifications) > 0 {
		goto SAVE_TO_DB
	}

	// ── Attempt 3: flat map {"1": "Major", "2": "Minor"}
	{
		var flatMap map[string]string
		if err := json.Unmarshal([]byte(cleanedResponse), &flatMap); err == nil && len(flatMap) > 0 {
			for k, v := range flatMap {
				if id, parseErr := strconv.ParseUint(k, 10, 64); parseErr == nil {
					finalClassifications = append(finalClassifications, ClassificationItem{ID: id, Category: v})
				}
			}
			if len(finalClassifications) > 0 {
				goto SAVE_TO_DB
			}
		}
	}

	// ── Attempt 4: regex scan — last resort when JSON is badly formed
	{
		// Find patterns like "id":5,"category":"Major" anywhere in the string
		for _, item := range log.FeedbackItems {
			idStr := strconv.FormatUint(item.ID, 10)
			// Look for the id near a category label anywhere in the response
			idMarker := `"id":` + idStr
			if idx := strings.Index(aiResponse, idMarker); idx != -1 {
				chunk := aiResponse[idx:]
				if len(chunk) > 80 {
					chunk = chunk[:80]
				}
				chunk = strings.ToLower(chunk)
				cat := "Minor"
				if strings.Contains(chunk, "major") {
					cat = "Major"
				}
				finalClassifications = append(finalClassifications, ClassificationItem{ID: item.ID, Category: cat})
			}
		}
		if len(finalClassifications) > 0 {
			if os.Getenv("GIN_MODE") != "release" {
				fmt.Printf("[AI CLASSIFICATION] Used regex fallback — %d items recovered\n", len(finalClassifications))
			}
			goto SAVE_TO_DB
		}
	}

	// ── All attempts failed
	c.JSON(http.StatusInternalServerError, gin.H{
		"error": "Failed to parse AI classification results. The response format returned by the AI was not recognized. Please try sorting again.",
	})
	return

SAVE_TO_DB:
	// Save to DB and prepare broadcast payloads
	tx := koneksi.DB.Begin()
	for _, cl := range finalClassifications {
		if cl.Category == "Major" || cl.Category == "Minor" {
			tx.Model(&models.FeedbackItem{}).Where("id = ? AND log_id = ?", cl.ID, log.ID).Update("category", cl.Category)
		}
	}
	tx.Commit()

	// Reload all feedback items and broadcast
	var updatedItems []models.FeedbackItem
	koneksi.DB.Where("log_id = ?", log.ID).Find(&updatedItems)

	if WebSocketHub != nil {
		for _, item := range updatedItems {
			WebSocketHub.Broadcast("consultation."+strconv.FormatUint(log.ID, 10), "feedback.status-updated", gin.H{
				"feedback_id":          item.ID,
				"log_id":               item.ConsultationLogID,
				"consultation_log_id":  item.ConsultationLogID,
				"status":               item.Status,
				"category":             item.Category,
				"updated_by_role":      user.Role,
			})
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Feedback items classified successfully", "data": updatedItems})
}
