package cms

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type Page struct {
	ID           uuid.UUID   `json:"id"`
	Slug         string      `json:"slug"`
	Title        string      `json:"title"`
	Subtitle     *string     `json:"subtitle,omitempty"`
	Description  *string     `json:"description,omitempty"`
	PageType     string      `json:"page_type"`
	Template     *string     `json:"template,omitempty"`
	Status       string      `json:"status"`
	Visibility   string      `json:"visibility"`
	CoverImage   *string     `json:"cover_image,omitempty"`
	Thumbnail    *string     `json:"thumbnail,omitempty"`
	AuthorID     *uuid.UUID  `json:"author_id,omitempty"`
	EditorID     *uuid.UUID  `json:"editor_id,omitempty"`
	PublishedAt  *time.Time  `json:"published_at,omitempty"`
	CreatedAt    time.Time   `json:"created_at"`
	UpdatedAt    time.Time   `json:"updated_at"`
	Blocks       []PageBlock `json:"blocks,omitempty"`
	SEO          *PageSEO    `json:"seo,omitempty"`
}

type PageBlock struct {
	ID            uuid.UUID       `json:"id"`
	PageID        uuid.UUID       `json:"page_id"`
	ComponentType *string         `json:"component_type,omitempty"`
	ComponentName *string         `json:"component_name,omitempty"`
	SortOrder     int             `json:"sort_order"`
	Config        json.RawMessage `json:"config,omitempty"`
	Active        bool            `json:"active"`
	CreatedAt     time.Time       `json:"created_at"`
	UpdatedAt     time.Time       `json:"updated_at"`
}

type PageVersion struct {
	ID        uuid.UUID `json:"id"`
	PageID    uuid.UUID `json:"page_id"`
	Version   int       `json:"version"`
	Title     *string   `json:"title,omitempty"`
	Content   *string   `json:"content,omitempty"`
	EditorID  *uuid.UUID `json:"editor_id,omitempty"`
	Published bool      `json:"published"`
	CreatedAt time.Time `json:"created_at"`
}

type PageSEO struct {
	ID             uuid.UUID       `json:"id"`
	PageID         uuid.UUID       `json:"page_id"`
	MetaTitle      *string         `json:"meta_title,omitempty"`
	MetaDescription *string        `json:"meta_description,omitempty"`
	MetaKeyword    *string         `json:"meta_keyword,omitempty"`
	CanonicalURL   *string         `json:"canonical_url,omitempty"`
	Robots         *string         `json:"robots,omitempty"`
	OgTitle        *string         `json:"og_title,omitempty"`
	OgDescription  *string         `json:"og_description,omitempty"`
	OgImage        *string         `json:"og_image,omitempty"`
	SchemaJSON     json.RawMessage `json:"schema_json,omitempty"`
	CreatedAt      time.Time       `json:"created_at"`
	UpdatedAt      time.Time       `json:"updated_at"`
}

type Post struct {
	ID           uuid.UUID  `json:"id"`
	Slug         string     `json:"slug"`
	Title        string     `json:"title"`
	Excerpt      *string    `json:"excerpt,omitempty"`
	Content      *string    `json:"content,omitempty"`
	CoverImage   *string    `json:"cover_image,omitempty"`
	CategoryID   *uuid.UUID `json:"category_id,omitempty"`
	AuthorID     *uuid.UUID `json:"author_id,omitempty"`
	Status       string     `json:"status"`
	PublishedAt  *time.Time `json:"published_at,omitempty"`
	ReadingTime  int        `json:"reading_time"`
	ViewCount    int        `json:"view_count"`
	LikeCount    int        `json:"like_count"`
	ShareCount   int        `json:"share_count"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
	Category     *Category  `json:"category,omitempty"`
	Tags         []Tag      `json:"tags,omitempty"`
}

type PostVersion struct {
	ID        uuid.UUID  `json:"id"`
	PostID    uuid.UUID  `json:"post_id"`
	Version   int        `json:"version"`
	Content   *string    `json:"content,omitempty"`
	EditorID  *uuid.UUID `json:"editor_id,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
}

type Category struct {
	ID          uuid.UUID  `json:"id"`
	ParentID    *uuid.UUID `json:"parent_id,omitempty"`
	Name        string     `json:"name"`
	Slug        string     `json:"slug"`
	Description *string    `json:"description,omitempty"`
	Icon        *string    `json:"icon,omitempty"`
	SortOrder   int        `json:"sort_order"`
	Active      bool       `json:"active"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

type Tag struct {
	ID        uuid.UUID `json:"id"`
	Name      string    `json:"name"`
	Slug      string    `json:"slug"`
	Color     *string   `json:"color,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

type Setting struct {
	ID           uuid.UUID `json:"id"`
	Key          string    `json:"key"`
	Value        *string   `json:"value,omitempty"`
	Description  *string   `json:"description,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type FAQ struct {
	ID        uuid.UUID  `json:"id"`
	Category  *string    `json:"category,omitempty"`
	Question  string     `json:"question"`
	Answer    *string    `json:"answer,omitempty"`
	SortOrder int        `json:"sort_order"`
	Active    bool       `json:"active"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}

type Banner struct {
	ID          uuid.UUID  `json:"id"`
	Title       string     `json:"title"`
	Subtitle    *string    `json:"subtitle,omitempty"`
	Image       *string    `json:"image,omitempty"`
	MobileImage *string    `json:"mobile_image,omitempty"`
	ButtonText  *string    `json:"button_text,omitempty"`
	ButtonLink  *string    `json:"button_link,omitempty"`
	Position    int        `json:"position"`
	Priority    int        `json:"priority"`
	StartDate   *time.Time `json:"start_date,omitempty"`
	EndDate     *time.Time `json:"end_date,omitempty"`
	Status      string     `json:"status"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

type News struct {
	ID          uuid.UUID  `json:"id"`
	Title       string     `json:"title"`
	Slug        string     `json:"slug"`
	Content     *string    `json:"content,omitempty"`
	Cover       *string    `json:"cover,omitempty"`
	Category    *string    `json:"category,omitempty"`
	Status      string     `json:"status"`
	PublishedAt *time.Time `json:"published_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// --- Request DTOs ---

type SavePageRequest struct {
	Slug        string         `json:"slug"`
	Title       string         `json:"title"`
	Subtitle    *string        `json:"subtitle,omitempty"`
	Description *string        `json:"description,omitempty"`
	PageType    string         `json:"page_type"`
	Template    *string        `json:"template,omitempty"`
	Visibility  string         `json:"visibility"`
	CoverImage  *string        `json:"cover_image,omitempty"`
	Thumbnail   *string        `json:"thumbnail,omitempty"`
	Content     *string        `json:"content,omitempty"`
	Blocks      []SaveBlockReq `json:"blocks,omitempty"`
}

type SaveBlockReq struct {
	ComponentType *string         `json:"component_type,omitempty"`
	ComponentName *string         `json:"component_name,omitempty"`
	SortOrder     int             `json:"sort_order"`
	Config        json.RawMessage `json:"config,omitempty"`
	Active        *bool           `json:"active,omitempty"`
}

type SaveSEORequest struct {
	MetaTitle      *string         `json:"meta_title,omitempty"`
	MetaDescription *string        `json:"meta_description,omitempty"`
	MetaKeyword    *string         `json:"meta_keyword,omitempty"`
	CanonicalURL   *string         `json:"canonical_url,omitempty"`
	Robots         *string         `json:"robots,omitempty"`
	OgTitle        *string         `json:"og_title,omitempty"`
	OgDescription  *string         `json:"og_description,omitempty"`
	OgImage        *string         `json:"og_image,omitempty"`
	SchemaJSON     json.RawMessage `json:"schema_json,omitempty"`
}

type SavePostRequest struct {
	Slug        string      `json:"slug"`
	Title       string      `json:"title"`
	Excerpt     *string     `json:"excerpt,omitempty"`
	Content     *string     `json:"content,omitempty"`
	CoverImage  *string     `json:"cover_image,omitempty"`
	CategoryID  *uuid.UUID  `json:"category_id,omitempty"`
	Status      string      `json:"status"`
	ReadingTime int         `json:"reading_time"`
	TagIDs      []uuid.UUID `json:"tag_ids,omitempty"`
}

type SaveCategoryRequest struct {
	ParentID    *uuid.UUID `json:"parent_id,omitempty"`
	Name        string     `json:"name"`
	Slug        string     `json:"slug"`
	Description *string    `json:"description,omitempty"`
	Icon        *string    `json:"icon,omitempty"`
	SortOrder   int        `json:"sort_order"`
	Active      *bool      `json:"active,omitempty"`
}

type SaveTagRequest struct {
	Name  string  `json:"name"`
	Slug  string  `json:"slug"`
	Color *string `json:"color,omitempty"`
}

type SaveSettingRequest struct {
	Value       *string `json:"value,omitempty"`
	Description *string `json:"description,omitempty"`
}

type SaveFAQRequest struct {
	Category  *string `json:"category,omitempty"`
	Question  string  `json:"question"`
	Answer    *string `json:"answer,omitempty"`
	SortOrder int     `json:"sort_order"`
	Active    *bool   `json:"active,omitempty"`
}

type SaveBannerRequest struct {
	Title       string     `json:"title"`
	Subtitle    *string    `json:"subtitle,omitempty"`
	Image       *string    `json:"image,omitempty"`
	MobileImage *string    `json:"mobile_image,omitempty"`
	ButtonText  *string    `json:"button_text,omitempty"`
	ButtonLink  *string    `json:"button_link,omitempty"`
	Position    int        `json:"position"`
	Priority    int        `json:"priority"`
	StartDate   *time.Time `json:"start_date,omitempty"`
	EndDate     *time.Time `json:"end_date,omitempty"`
	Status      string     `json:"status"`
}

type SaveNewsRequest struct {
	Title    string  `json:"title"`
	Slug     string  `json:"slug"`
	Content  *string `json:"content,omitempty"`
	Cover    *string `json:"cover,omitempty"`
	Category *string `json:"category,omitempty"`
	Status   string  `json:"status"`
}
