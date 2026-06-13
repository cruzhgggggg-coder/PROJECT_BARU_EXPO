package models

import (
	"time"

	"gorm.io/gorm"
)

type UserRole string

const (
	RoleStudent  UserRole = "student"
	RoleLecturer UserRole = "lecturer"
)

type AnnotationFileType string

const (
	AnnotationImage AnnotationFileType = "image"
	AnnotationDocx  AnnotationFileType = "docx"
)

type FeedbackCategory string

const (
	CategoryMinor FeedbackCategory = "Minor"
	CategoryMajor FeedbackCategory = "Major"
)

type FeedbackStatus string

const (
	StatusFixed     FeedbackStatus = "Fixed"
	StatusPending   FeedbackStatus = "Pending"
	StatusValidated FeedbackStatus = "Validated"
)

type User struct {
	ID        uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	Name      string    `gorm:"not null;type:varchar(255)" json:"name"`
	Email     string    `gorm:"unique;not null;type:varchar(255)" json:"email"`
	Password  string    `gorm:"not null;type:varchar(255)" json:"-"`
	Role      UserRole  `gorm:"type:enum('student','lecturer');not null" json:"role"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// D-2: All foreign key relationships use constraint:OnDelete:CASCADE or RESTRICT
	// to prevent orphan records at the database level
	Student  *Student  `gorm:"foreignKey:UserID" json:"student,omitempty"`
	Lecturer *Lecturer `gorm:"foreignKey:UserID" json:"lecturer,omitempty"`

	// TODO: D-1 - Move API keys to separate `user_api_keys` table with row-level encryption
	// Current implementation encrypts at application level via AES-GCM
	OpenAIKey       string `gorm:"type:varchar(255)" json:"openai_key"`
	GeminiKey       string `gorm:"type:varchar(255)" json:"gemini_key"`
	AnthropicKey    string `gorm:"type:varchar(255)" json:"anthropic_key"`
	NvidiaKey       string `gorm:"type:varchar(255)" json:"nvidia_key"`
	GroqKey         string `gorm:"type:varchar(255)" json:"groq_key"`
	PreferredModel  string `gorm:"type:varchar(100);default:'default'" json:"preferred_model"`
	IsGatewayActive bool   `gorm:"default:false" json:"is_gateway_active"`
}

type RefreshToken struct {
	ID        uint64     `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID    uint64     `gorm:"not null;index" json:"user_id"`
	TokenHash string     `gorm:"type:char(64);uniqueIndex;not null" json:"-"`
	ExpiresAt time.Time  `gorm:"not null;index" json:"expires_at"`
	RevokedAt *time.Time `json:"revoked_at,omitempty"`
	UserAgent string     `gorm:"type:varchar(255)" json:"user_agent"`
	IPAddress string     `gorm:"type:varchar(64)" json:"ip_address"`
	CreatedAt time.Time  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"autoUpdateTime" json:"updated_at"`

	User *User `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"user,omitempty"`
}

type RedeemCode struct {
	ID        uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	Code      string    `gorm:"unique;not null;type:varchar(50)" json:"code"`
	IsUsed    bool      `gorm:"default:false" json:"is_used"`
	UsedBy    *uint64   `json:"used_by"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

type Lecturer struct {
	ID            uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID        uint64    `gorm:"not null" json:"user_id"`
	NIP           string    `gorm:"column:nip;unique;not null;type:varchar(20)" json:"nip"`
	Name          string    `gorm:"not null;type:varchar(100)" json:"name"`
	Keahlian      string    `gorm:"type:varchar(100)" json:"keahlian"`
	Faculty       string    `gorm:"type:varchar(100)" json:"faculty"`
	AiConstraints string    `gorm:"type:text" json:"ai_constraints"`
	CreatedAt     time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt     time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	User User `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"user,omitempty"`
}

type Student struct {
	ID          uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID      uint64    `gorm:"not null" json:"user_id"`
	LecturerID  uint64    `gorm:"not null" json:"lecturer_id"`
	NIM         string    `gorm:"unique;not null;type:varchar(20)" json:"nim"`
	Name        string    `gorm:"not null;type:varchar(100)" json:"name"`
	Prodi       string    `gorm:"type:varchar(100)" json:"prodi"`
	ThesisTitle string    `gorm:"type:text" json:"thesis_title"`
	CreatedAt   time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	User     *User     `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"user,omitempty"`
	Lecturer *Lecturer `gorm:"foreignKey:LecturerID;constraint:OnDelete:RESTRICT" json:"lecturer,omitempty"`
}

type ConsultationLog struct {
	ID                         uint64         `gorm:"primaryKey;autoIncrement" json:"id"`
	StudentID                  uint64         `gorm:"not null;index:idx_student_id" json:"student_id"`
	AudioFilename              string         `gorm:"type:varchar(255)" json:"audio_filename"`
	TranscriptFilename         string         `gorm:"type:varchar(255)" json:"transcript_filename"`
	// D-7: Consider excluding TranscriptText from list queries using Omit()
	// to reduce data transfer: koneksi.DB.Omit("Transcript_text").Find(&logs)
	TranscriptText             string         `gorm:"type:longtext" json:"transcript_text"`
	PaperFilename              string         `gorm:"type:varchar(255)" json:"paper_filename"`
	FinalDocumentFilename      string         `gorm:"type:varchar(255)" json:"final_document_filename"`
	FinalDocumentUploadedAt    *time.Time     `json:"final_document_uploaded_at"`
	RevisedDocumentFilename    string         `gorm:"type:varchar(255)" json:"revised_document_filename"`
	RevisedDocumentUploadedAt  *time.Time     `json:"revised_document_uploaded_at"`
	CreatedAt                  time.Time      `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt                  time.Time      `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt                  gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`

	Student            *Student               `gorm:"foreignKey:StudentID;constraint:OnDelete:CASCADE" json:"student,omitempty"`
	FeedbackItems      []FeedbackItem         `gorm:"foreignKey:ConsultationLogID;constraint:OnDelete:CASCADE" json:"feedback_items"`
	RevisionAnnotations []RevisionAnnotation  `gorm:"foreignKey:ConsultationLogID;constraint:OnDelete:CASCADE" json:"revision_annotations,omitempty"`
}

type FeedbackItem struct {
	ID                uint64           `gorm:"primaryKey;autoIncrement" json:"id"`
	ConsultationLogID uint64           `gorm:"column:log_id;not null;index:idx_log_id" json:"consultation_log_id"`
	Content           string           `gorm:"type:text;not null" json:"content"`
	Category          FeedbackCategory `gorm:"type:enum('Minor','Major');not null;index:idx_category" json:"category"`
	Status            FeedbackStatus   `gorm:"type:enum('Fixed','Pending','Validated');not null;default:'Pending';index:idx_status" json:"status"`
	FixProofText      string           `gorm:"type:text" json:"fix_proof_text"`
	CreatedAt         time.Time        `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt         time.Time        `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt         gorm.DeletedAt   `gorm:"index" json:"deleted_at,omitempty"`

	Comments []FeedbackComment `gorm:"foreignKey:FeedbackItemID;constraint:OnDelete:CASCADE" json:"comments,omitempty"`
}

type FeedbackComment struct {
	ID             uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	FeedbackItemID uint64    `gorm:"column:feedback_item_id;not null;index" json:"feedback_id"`
	AuthorID       uint64    `gorm:"not null" json:"author_id"`
	AuthorRole     string    `gorm:"type:enum('student','lecturer');not null" json:"author_role"`
	Content        string    `gorm:"type:text;not null" json:"content"`
	CreatedAt      time.Time `gorm:"autoCreateTime" json:"created_at"`
}

// RevisionAnnotation stores annotated revision files uploaded by students (images of marked pages or docx with track changes)
type RevisionAnnotation struct {
	ID                uint64             `gorm:"primaryKey;autoIncrement" json:"id"`
	ConsultationLogID uint64             `gorm:"column:log_id;not null;index" json:"consultation_log_id"`
	Filename          string             `gorm:"type:varchar(255);not null" json:"filename"`
	FileType          AnnotationFileType `gorm:"type:enum('image','docx');not null" json:"file_type"`
	ExtractedText     string             `gorm:"type:longtext" json:"extracted_text"`
	CreatedAt         time.Time          `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt         time.Time          `gorm:"autoUpdateTime" json:"updated_at"`
}

type DirectMessage struct {
	ID         uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	LogID      uint64    `gorm:"column:log_id;not null;index" json:"log_id"`
	SenderID   uint64    `gorm:"not null" json:"sender_id"`
	SenderRole string    `gorm:"type:enum('student','lecturer');not null" json:"sender_role"`
	Content    string    `gorm:"type:text;not null" json:"content"`
	CreatedAt  time.Time `gorm:"autoCreateTime" json:"created_at"`
}

type AIChatMessage struct {
	ID        uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	LogID     uint64    `gorm:"column:log_id;not null;index" json:"log_id"`
	Role      string    `gorm:"type:enum('user','ai');not null" json:"role"`
	Content   string    `gorm:"type:text;not null" json:"content"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
}
