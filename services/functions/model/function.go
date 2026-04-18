package model

import "time"

type Function struct {
	ID         string `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	Name       string `gorm:"not null"`
	Runtime    string `gorm:"not null"`
	Code       string `gorm:"type:text;not null"`
	TimeoutSec int    `gorm:"default:30;not null"`
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

type ExecutionLog struct {
	ID         string `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	FunctionID string `gorm:"type:uuid;not null;index"`
	Output     string `gorm:"type:text"`
	Error      string `gorm:"type:text"`
	ExitCode   int
	DurationMs int64
	CreatedAt  time.Time
}
