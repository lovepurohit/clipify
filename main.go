package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"strconv"

	_ "modernc.org/sqlite"
)

// Clip represents a shared clipboard clip
type Clip struct {
	ID         string `json:"id"`
	Text       string `json:"text"`
	Language   string `json:"language"`
	Name       string `json:"name"`
	DeviceType string `json:"device_type"`
	Browser    string `json:"browser"`
}

var db *sql.DB

func init() {
	// Open SQLite database (creates it if it doesn't exist)
	var err error
	db, err = sql.Open("sqlite", "./clips.db")
	if err != nil {
		log.Fatal(err)
	}

	// Create the clips table if it doesn't exist
	createTableSQL := `
	CREATE TABLE IF NOT EXISTS clips (
		id TEXT PRIMARY KEY,
		text TEXT,
		language TEXT,
		name TEXT,
		device_type TEXT,
		browser TEXT
		);
	`
	_, err = db.Exec(createTableSQL)
	if err != nil {
		log.Fatal(err)
	}
}

func getLocalIP() (string, error) {
	// Get all network interfaces and check for the local IP
	addrs, err := net.InterfaceAddrs()
	if err != nil {
		return "", err
	}

	// Loop through all interfaces to find the local IP address
	for _, addr := range addrs {
		// Check if the address is a valid IP address and is not a loopback address
		if ipnet, ok := addr.(*net.IPNet); ok && !ipnet.IP.IsLoopback() && ipnet.IP.To4() != nil {
			return ipnet.IP.String(), nil
		}
	}

	return "", fmt.Errorf("local IP not found")
}

// isRequestFromLocalMachine checks if the request is coming from the local machine (localhost or local IP)
func isRequestFromLocalMachine(r *http.Request) (bool, string, error) {
	// Get the local IP address of the system
	localIP, err := getLocalIP()
	if err != nil {
		return false, "Failed to get local IP address", err
	}

	// Get the IP address of the incoming request
	clientIP, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return false, "Failed to get client IP address", err
	}

	// fmt.Printf("LocalIP: %s || Client IP: %s\n", localIP, clientIP)

	// Check if the client is accessing from localhost or the local machine's IP
	if clientIP == "localhost" || clientIP == "127.0.0.1" || clientIP == localIP {
		return true, "Success", nil
	}

	return false, "Forbidden", nil
}

// addClip handles the request to add a new clip to the database
func addClip(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	// Parse the incoming JSON body
	var clip Clip
	err := json.NewDecoder(r.Body).Decode(&clip)
	if err != nil {
		http.Error(w, "Failed to parse clip", http.StatusBadRequest)
		return
	}

	// Insert the clip into the database
	insertSQL := `INSERT INTO clips (id, text, language, name, device_type, browser) VALUES (?, ?, ?, ?, ?, ?)`
	_, err = db.Exec(insertSQL, clip.ID, clip.Text, clip.Language, clip.Name, clip.DeviceType, clip.Browser)
	if err != nil {
		http.Error(w, "Failed to insert clip into database", http.StatusInternalServerError)
		return
	}

	// Respond with success
	w.WriteHeader(http.StatusCreated)
}

// getClips handles the request to retrieve all clips from the database
func getClips(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	// Retrieve all clips from the database
	rows, err := db.Query("SELECT id, text, language, name, device_type, browser FROM clips")
	if err != nil {
		http.Error(w, "Failed to fetch clips from database", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var clips []Clip
	for rows.Next() {
		var clip Clip
		err := rows.Scan(&clip.ID, &clip.Text, &clip.Language, &clip.Name, &clip.DeviceType, &clip.Browser)
		if err != nil {
			http.Error(w, "Failed to scan clip", http.StatusInternalServerError)
			return
		}
		clips = append(clips, clip)
	}

	// Check for any row scanning error
	if err := rows.Err(); err != nil {
		http.Error(w, "Failed to fetch clips from database", http.StatusInternalServerError)
		return
	}

	// Respond with the clips in JSON format
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(clips)
}

// flushDatabase handles the request to flush all clips from the database
func flushDatabase(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	isLocal, msg, err := isRequestFromLocalMachine(r)
	if err != nil {
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}

	if !isLocal {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	// Perform the flush by deleting all rows from the clips table
	_, err = db.Exec("DELETE FROM clips")
	if err != nil {
		http.Error(w, "Failed to flush the database", http.StatusInternalServerError)
		return
	}

	// Respond with success
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Database flushed successfully"))
}

func validateUser(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	// Use the common function to validate the request
	isLocal, msg, err := isRequestFromLocalMachine(r)
	if err != nil {
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}

	if isLocal {
		// Respond with a success status indicating the user is correct
		w.WriteHeader(http.StatusOK)
	} else {
		// Respond with forbidden if the request is not from the local system
		http.Error(w, "Forbidden", http.StatusForbidden)
	}
}

func main() {
	http.HandleFunc("/add_clip", addClip)
	http.HandleFunc("/clips", getClips)
	http.HandleFunc("/flush", flushDatabase)        // Add the flush handler
	http.HandleFunc("/validate_user", validateUser) // Add the validate user handler
	http.Handle("/", http.StripPrefix("/", http.FileServer(http.Dir("static"))))

	// Get the local IP address
	localIP, err := getLocalIP()
	if err != nil {
		log.Fatal("Failed to get local IP address: ", err)
	}

	// Start the server
	port := ":8080"

	// Start the server on both localhost and local IP
	// Start the server at localhost (for local testing)
	go func() {
		fmt.Printf("Server started at http://localhost%s\n", port)
		if err := http.ListenAndServe("localhost"+port, nil); err != nil {
			log.Fatal("Error starting server on localhost: ", err)
		}
	}()

	// // Set up mDNS (Multicast DNS) for local network discovery
	// // Create a new mDNS service
	// server, err := zeroconf.Register("clipify", "_http._tcp", "local.", 8080, nil, nil)
	// if err != nil {
	// 	log.Fatal("Failed to register mDNS service:", err)
	// }
	// defer server.Shutdown()

	// Start the server on the local IP (for LAN access)
	var address string
	_, status := os.LookupEnv("IS_DOCKERISED")
	if status {
		address = fmt.Sprintf("%s%s", "0.0.0.0", port)
	} else {
		address = fmt.Sprintf("%s%s", localIP, port)
	}
	fmt.Printf("Local IP: %s\n", localIP)
	fmt.Printf("Server started at http://%s\n", address)
	if err := http.ListenAndServe(localIP+port, nil); err != nil {
		log.Fatal("Error starting server on local IP: ", err)
	}
}

// getClips handles the request to retrieve clips from the database with pagination
func getClipsPaginated(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	// Get pagination parameters
	pageStr := r.URL.Query().Get("page")
	limitStr := r.URL.Query().Get("limit")

	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 1 {
		limit = 10 // Default limit
	}

	offset := (page - 1) * limit

	// Retrieve paginated clips from the database
	rows, err := db.Query("SELECT id, text, language, name, device_type, browser FROM clips LIMIT ? OFFSET ?", limit, offset)
	if err != nil {
		http.Error(w, "Failed to fetch clips from database", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var clips []Clip
	for rows.Next() {
		var clip Clip
		err := rows.Scan(&clip.ID, &clip.Text, &clip.Language)
		if err != nil {
			http.Error(w, "Failed to scan clip", http.StatusInternalServerError)
			return
		}
		clips = append(clips, clip)
	}

	// Get the total number of clips for pagination info
	var totalClips int
	err = db.QueryRow("SELECT COUNT(*) FROM clips").Scan(&totalClips)
	if err != nil {
		http.Error(w, "Failed to fetch total clip count", http.StatusInternalServerError)
		return
	}

	// Calculate total number of pages
	totalPages := (totalClips + limit - 1) / limit

	// Respond with the clips and pagination info
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"clips":       clips,
		"totalPages":  totalPages,
		"currentPage": page,
		"totalClips":  totalClips,
	})
}
