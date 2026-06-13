package main

import (
	"fmt"
	"os"
	"strings"
	"time"

	"testing_go/controller"
	"testing_go/koneksi"
	"testing_go/middleware"
	"testing_go/realtime"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func init() {
	folders := []string{
		"storage/audio",
		"storage/transcript",
		"storage/paper",
		"storage/annotations",
		"storage/final",
		"storage/revised",
	}

	for _, folder := range folders {
		if err := os.MkdirAll(folder, os.ModePerm); err != nil {
			fmt.Printf("Failed to create directory %s: %v\n", folder, err)
		}
	}
}

func loadEnv() {
	_ = godotenv.Load(".env")
	_ = godotenv.Load("tierlog_v2/.env")
}

func corsMiddleware() gin.HandlerFunc {
	allowedOrigins := map[string]bool{
		"http://localhost:8081":  true, // Expo web dev
		"http://localhost:19006": true, // Expo web alt port
		"http://localhost:5173":  true, // Vite dev server
		"http://localhost:3000":  true, // Common dev port
	}

	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		allowed := allowedOrigins[origin]
		if !allowed {
			// Check for configured tunnel origin
			if tunnelOrigin := os.Getenv("NGROK_ORIGIN"); tunnelOrigin != "" {
				if strings.HasPrefix(tunnelOrigin, "https://") && origin == tunnelOrigin {
					allowed = true
				}
			}
		}
		if allowed {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
			c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		}
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, PATCH, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}

func main() {
	loadEnv()
	koneksi.ConnectDatabase()

	ginMode := os.Getenv("GIN_MODE")
	if ginMode == "" {
		ginMode = gin.DebugMode
	}
	gin.SetMode(ginMode)

	r := gin.Default()
	r.SetTrustedProxies(nil)
	r.MaxMultipartMemory = 20 << 20 // 20 MB max multipart memory
	r.Use(func(c *gin.Context) {
		if c.Request.ContentLength > 32*1024*1024 {
			c.AbortWithStatusJSON(413, gin.H{"error": "Request body too large"})
			return
		}
		c.Next()
	})
	r.Use(corsMiddleware())

	// Rate limiter for auth endpoints: 20 requests per minute per IP
	authLimiter := middleware.NewRateLimiter(20, time.Minute)

	hub := realtime.NewHub()
	controller.SetRealtimeHub(hub)

	// Protected static file serving - requires authentication
	storageGroup := r.Group("/storage")
	storageGroup.Use(middleware.AuthRequired())
	storageGroup.Static("", "./storage")

	r.GET("/ws", hub.HandleWebSocket)

	r.POST("/auth/register", middleware.RateLimit(authLimiter), controller.Register)
	r.POST("/auth/login", middleware.RateLimit(authLimiter), controller.Login)
	r.POST("/auth/refresh", middleware.RateLimit(authLimiter), controller.Refresh)
	r.POST("/auth/logout", controller.Logout)
	r.GET("/auth/lecturers", controller.GetLecturers)

	protected := r.Group("/")
	protected.Use(middleware.AuthRequired())
	{
		protected.GET("/auth/me", controller.Me)
		protected.PATCH("/settings/profile", controller.UpdateProfile)
		protected.PUT("/settings/password", controller.UpdatePassword)
		protected.PATCH("/settings/ai-gateway", controller.UpdateAIGatewaySettingsV2)
		protected.POST("/settings/ai-gateway/redeem", controller.RedeemGatewayCodeV2)

		protected.GET("/dashboard/stats", controller.DashboardStatsV2)
		protected.GET("/consultations", controller.ConsultationListV2)
		protected.POST("/consultations", controller.CreateConsultationV2)
		protected.POST("/consultations/chat", controller.ConsultationChatV2)
		protected.PUT("/consultations/feedback/:id/status", controller.UpdateFeedbackStatusV2)
		protected.POST("/consultations/feedback/:id/comments", controller.AddFeedbackComment)
		protected.POST("/consultations/:id/add-feedback", controller.LecturerAddFeedbackV2)
		protected.POST("/consultations/:id/final-document", controller.UploadFinalDocument)
		protected.POST("/consultations/:id/revised-document", controller.UploadRevisedDocument)
		protected.GET("/consultations/:id/direct-messages", controller.GetDirectMessages)
		protected.POST("/consultations/:id/direct-messages", controller.SendDirectMessage)
		protected.GET("/consultations/:id/ai-chats", controller.GetAIChats)
		protected.POST("/consultations/:id/classify-feedback", controller.ClassifyFeedbackV2)
		protected.GET("/lecturer/consultations", controller.LecturerConsultationsV2)
		protected.GET("/lecturer/students", controller.LecturerStudentsV2)
		protected.GET("/logs", controller.ArchiveListV2)
	}

	legacyAPI := r.Group("/api")
	legacyAPI.Use(middleware.AuthRequired())
	{
		legacyAPI.POST("/consultation", controller.CreateConsultation)
		legacyAPI.GET("/consultation", controller.GetConsultations)
		legacyAPI.GET("/stats", controller.GetStats)
		legacyAPI.POST("/ai/assist", controller.AIAssistHandler)
		legacyAPI.GET("/ai/models", controller.GetAIModels)
		legacyAPI.PUT("/feedback/:id/status", controller.UpdateFeedbackStatus)
		legacyAPI.GET("/lecturer/:id/consultations", controller.GetLecturerConsultations)
		legacyAPI.GET("/lecturer/:id/students", controller.GetLecturerStudents)
		legacyAPI.POST("/settings/ai-keys", controller.UpdateAIGatewaySettings)
		legacyAPI.POST("/settings/redeem", controller.RedeemGatewayCode)
		legacyAPI.POST("/admin/generate-code", controller.GenerateRedeemCode)
	}

	// User/lecturer/student CRUD removed — use /auth/register and protected settings endpoints

	fmt.Println("TierLog unified backend is running at http://localhost:8080")
	_ = r.Run(":8080")
}
