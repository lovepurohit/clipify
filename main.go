package main

import (
	"crypto/tls"
	"crypto/x509"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"strings"

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

// init initializes the database and creates the necessary table
func init() {
	var err error
	// Open SQLite database (creates it if it doesn't exist)
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

// Utility function to get the local IP address of the machine
func getLocalIP() (string, error) {
	// Get all network interfaces and check for the local IP
	addrs, err := net.InterfaceAddrs()
	if err != nil {
		return "", err
	}

	// Loop through all interfaces to find the local IP address
	for _, addr := range addrs {
		// Check if the address is a valid IP address and is not a loopback address
		ipnet, ok := addr.(*net.IPNet)
		if !ok || ipnet.IP.IsLoopback() || ipnet.IP.To4() == nil {
			continue
		}

		// Ignore link-local (169.x.x.x) addresses
		if ipnet.IP.IsLinkLocalUnicast() {
			continue
		}

		// Return the first valid local IP address found
		return ipnet.IP.String(), nil

	}

	return "", fmt.Errorf("local IP not found")
}

// Checks if the incoming request is from the local machine (localhost or local IP)
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

	// Check if the client is accessing from localhost or the local machine's IP
	if clientIP == "localhost" || clientIP == "127.0.0.1" || clientIP == localIP {
		return true, "Success", nil
	}

	return false, "Forbidden", nil
}

// Handles adding a new clip to the database
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

// Handles fetching all clips from the database
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

// Handles flushing the database (deletes all clips)
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

// Validates if the request is from the local machine
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

func updatePort(port string) string {
	// Check if the port starts with a colon ":"
	if !strings.HasPrefix(port, ":") {
		// Add a colon if it's missing
		port = ":" + port
	}
	return port
}

// Redirects incoming HTTP requests to HTTPS
func redirectToHttps(w http.ResponseWriter, r *http.Request) {
	http.Redirect(w, r, "https://"+r.Host+r.RequestURI, http.StatusMovedPermanently)
}

// Sets up and starts the HTTP and HTTPS servers
func startServer() {
	// Get the local IP address
	localIP, err := getLocalIP()
	if err != nil {
		log.Fatal("Failed to get local IP address: ", err)
	}

	// Run on 0.0.0.0 if its inside docker
	isDockerised := os.Getenv("IS_DOCKERISED")
	if isDockerised != "" {
		localIP = "0.0.0.0"
	}

	// Start the HTTP server (on port 8080)
	port := os.Getenv("CLIPIFY_HTTP_PORT")
	if port == "" {
		port = ":8080" // Default to 8080 port for HTTP
	}
	port = updatePort(port)
	httpsPort := os.Getenv("CLIPIFY_HTTPS_PORT")
	if httpsPort == "" {
		httpsPort = ":8443" // Default to 8443 port for HTTPS
	}
	httpsPort = updatePort(httpsPort)

	// Get the SystemCertPool and create a custom root CA pool
	rootCAs, _ := x509.SystemCertPool()
	if rootCAs == nil {
		rootCAs = x509.NewCertPool()
	}

	// Read the SSL certificate
	certs, err := os.ReadFile("localhost.crt")
	if err != nil {
		log.Fatalf("Failed to append %q to RootCAs: %v", "localhost.crt", err)
	}
	if ok := rootCAs.AppendCertsFromPEM(certs); !ok {
		log.Println("No certs appended, using system certs only")
	}

	// Start server on local IP (for LAN access)
	address := fmt.Sprintf("%s%s", localIP, httpsPort)
	server_local_ip := &http.Server{
		Addr:      address,
		TLSConfig: &tls.Config{RootCAs: rootCAs},
	}

	// Start HTTP and HTTPS servers in separate goroutines
	go func() {
		fmt.Printf("Server started at https://%s\n", address)
		// Wrap the handler to apply HSTS for all HTTPS requests
		if err := server_local_ip.ListenAndServeTLS("localhost.crt", "localhost.key"); err != nil {
			log.Fatal("Error starting HTTPS server on local IP: ", err)
		}
	}()

	if err := http.ListenAndServe(localIP+port, http.HandlerFunc(redirectToHttps)); err != nil {
		log.Fatal("Error starting server on localhost: ", err)
	}
}

func main() {
	// Register routes
	http.HandleFunc("/add_clip", addClip)
	http.HandleFunc("/clips", getClips)
	http.HandleFunc("/flush", flushDatabase)
	http.HandleFunc("/validate_user", validateUser)

	// Serve static files under the root path
	http.Handle("/", http.StripPrefix("/", http.FileServer(http.Dir("static"))))

	// Start the server
	startServer()
}
