package ws

import (
	"encoding/json"
	"log/slog"
	"sync"
	"time"

	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"

	"yakinlulus.id/backend/internal/middleware"
)

// WebSocket message type codes (RFC 6455)
const (
	wsTextMessage  = 1
	wsCloseMessage = 8
	wsPingMessage  = 9
)

// --- Message types ---

type MessageType string

const (
	MsgViolationAlert MessageType = "violation_alert"
	MsgSessionUpdate  MessageType = "session_update"
	MsgHeartbeat      MessageType = "heartbeat"
)

type Message struct {
	Type      MessageType `json:"type"`
	SessionID string      `json:"session_id,omitempty"`
	UserID    string      `json:"user_id,omitempty"`
	Data      interface{} `json:"data,omitempty"`
}

// --- Client ---

type Client struct {
	Hub    *Hub
	Conn   *websocket.Conn
	Send   chan []byte
	UserID string
	Role   string
}

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 4096
)

func (c *Client) readPump() {
	defer func() {
		c.Hub.Unregister <- c
		c.Conn.Close()
	}()

	c.Conn.SetReadLimit(maxMessageSize)
	c.Conn.SetReadDeadline(time.Now().Add(pongWait))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, msg, err := c.Conn.ReadMessage()
		if err != nil {
			break
		}
		var m Message
		if json.Unmarshal(msg, &m) == nil && m.Type == MsgHeartbeat {
			continue
		}
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			if !ok {
				_ = c.Conn.WriteMessage(wsCloseMessage, []byte{})
				return
			}
			_ = c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.Conn.WriteMessage(wsTextMessage, message); err != nil {
				return
			}
		case <-ticker.C:
			_ = c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.Conn.WriteMessage(wsPingMessage, nil); err != nil {
				return
			}
		}
	}
}

// --- Hub ---

type Hub struct {
	clients    map[*Client]bool
	Broadcast  chan []byte
	Register   chan *Client
	Unregister chan *Client
	mu         sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		Broadcast:  make(chan []byte, 256),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()
			slog.Info("ws client connected", "user", client.UserID, "role", client.Role)

		case client := <-h.Unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.Send)
			}
			h.mu.Unlock()
			slog.Info("ws client disconnected", "user", client.UserID, "role", client.Role)

		case message := <-h.Broadcast:
			h.mu.RLock()
			for client := range h.clients {
				select {
				case client.Send <- message:
				default:
					close(client.Send)
					delete(h.clients, client)
				}
			}
			h.mu.RUnlock()
		}
	}
}

// SendToUser sends a message to all clients with matching user_id.
// ponytail: role-based filtering, add when proctor filtering by role is needed.
func (h *Hub) SendToUser(userID string, msg []byte) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	for client := range h.clients {
		if client.UserID == userID {
			select {
			case client.Send <- msg:
			default:
			}
		}
	}
}

// SendToRole sends a message to all clients with matching role.
// ponytail: add when proctor filtering by role is needed.
func (h *Hub) SendToRole(role string, msg []byte) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	for client := range h.clients {
		if client.Role == role {
			select {
			case client.Send <- msg:
			default:
			}
		}
	}
}

// --- Handler ---

type Handler struct {
	hub *Hub
	jwt string
}

func NewHandler(hub *Hub, jwtSecret string) *Handler {
	return &Handler{hub: hub, jwt: jwtSecret}
}

func (h *Handler) RegisterRoutes(router fiber.Router) {
	r := router.Group("/ws", middleware.RequireAuth(h.jwt))
	r.Get("/proctor", middleware.RequireRole("SUPER_ADMIN", "STAFF", "GURU"), h.HandleProctorWebSocket)
	r.Get("/exam/:session_id", h.HandleExamWebSocket)
}

func (h *Handler) HandleProctorWebSocket(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(string)
	role := c.Locals("role").(string)

	return websocket.New(func(conn *websocket.Conn) {
		client := &Client{
			Hub:    h.hub,
			Conn:   conn,
			Send:   make(chan []byte, 256),
			UserID: userID,
			Role:   role,
		}
		h.hub.Register <- client
		defer func() { h.hub.Unregister <- client }()

		go client.writePump()
		client.readPump()
	})(c)
}

func (h *Handler) HandleExamWebSocket(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(string)
	role := c.Locals("role").(string)
	sessionID := c.Params("session_id")
	_ = sessionID // ponytail: validate session ownership, add when authz needed

	return websocket.New(func(conn *websocket.Conn) {
		client := &Client{
			Hub:    h.hub,
			Conn:   conn,
			Send:   make(chan []byte, 256),
			UserID: userID,
			Role:   role,
		}
		h.hub.Register <- client
		defer func() { h.hub.Unregister <- client }()

		go client.writePump()
		client.readPump()
	})(c)
}
