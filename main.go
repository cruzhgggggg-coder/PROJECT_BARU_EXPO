package main

import (
	"fmt"
	"os"

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
		if allowedOrigins[origin] {
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

	gin.SetMode(gin.ReleaseMode)
	r := gin.Default()
	r.SetTrustedProxies(nil)
	r.Use(corsMiddleware())

	hub := realtime.NewHub()
	controller.SetRealtimeHub(hub)

	r.Static("/storage", "./storage")

	r.GET("/ws", hub.HandleWebSocket)

	r.POST("/auth/register", controller.Register)
	r.POST("/auth/login", controller.Login)
	r.POST("/auth/refresh", controller.Refresh)
	r.POST("/auth/logout", controller.Logout)

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
		protected.POST("/consultations/:id/add-feedback", controller.LecturerAddFeedbackV2)
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
