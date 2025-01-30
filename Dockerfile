# Step 1: Build the Go binary
FROM golang:1.22-alpine as builder

# Set the working directory in the builder image
WORKDIR /app

# Copy the Go module files to the builder container
COPY go.mod go.sum ./

# Download dependencies
RUN go mod tidy

# Copy the rest of the application files
COPY . .

# Build the Go binary statically
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o clipify .

# Step 2: Create the final image using `scratch`
FROM scratch

# Set the working directory in the production container
WORKDIR /app

# Copy the statically compiled binary from the builder stage
COPY --from=builder /app/clipify /app/clipify

# Copy the static files (HTML, JS, CSS) into the container
COPY --from=builder /app/static /app/static

# Set env var to run on 0.0.0.0
ENV IS_DOCKERISED=true

# Expose the port the app will run on
EXPOSE 8080

# Run the statically compiled Go binary when the container starts
CMD ["/app/clipify"]
