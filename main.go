package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"

	_ "github.com/mattn/go-sqlite3"
)

// Clip represents a shared clipboard clip
type Clip struct {
	ID       string `json:"id"`
	Text     string `json:"text"`
	Language string `json:"language"`
}

var db *sql.DB

func init() {
	// Open SQLite database (creates it if it doesn't exist)
	var err error
	db, err = sql.Open("sqlite3", "./clips.db")
	if err != nil {
		log.Fatal(err)
	}

	// Create the clips table if it doesn't exist
	createTableSQL := `
	CREATE TABLE IF NOT EXISTS clips (
		id TEXT PRIMARY KEY,
		text TEXT,
		language TEXT
	);
	`
	_, err = db.Exec(createTableSQL)
	if err != nil {
		log.Fatal(err)
	}
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
	insertSQL := `INSERT INTO clips (id, text, language) VALUES (?, ?, ?)`
	_, err = db.Exec(insertSQL, clip.ID, clip.Text, clip.Language)
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
	rows, err := db.Query("SELECT id, text, language FROM clips")
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

	// Perform the flush by deleting all rows from the clips table
	_, err := db.Exec("DELETE FROM clips")
	if err != nil {
		http.Error(w, "Failed to flush the database", http.StatusInternalServerError)
		return
	}

	// Respond with success
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Database flushed successfully"))
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

func main() {
	http.HandleFunc("/add_clip", addClip)
	http.HandleFunc("/clips", getClips)
	http.HandleFunc("/flush", flushDatabase) // Add the flush handler
	http.Handle("/", http.StripPrefix("/", http.FileServer(http.Dir("static"))))

	// Get the local IP address
	localIP, err := getLocalIP()
	if err != nil {
		log.Fatal("Failed to get local IP address: ", err)
	}

	// Start the server
	port := ":8080"
	// address := fmt.Sprintf("%s%s", localIP, port)
	// fmt.Printf("Server started at %s\n", address)
	// log.Fatal(http.ListenAndServe(address, nil))

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
	address := fmt.Sprintf("%s%s", localIP, port)
	fmt.Printf("Server started at http://%s\n", address)
	if err := http.ListenAndServe(localIP+port, nil); err != nil {
		log.Fatal("Error starting server on local IP: ", err)
	}
}
