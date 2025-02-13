# Clipify

## Overview

`Clipify` is a simple and secure solution for managing and sharing data across different devices and platforms without the hassle of complicated setups or reliance on external services. It is built using Go and SQLite as the backend database. Here are some reasons why you might find it useful:

- **Cross-Device Compatibility**: It allows users to share data across desktops, mobile devices (Android/iOS), and other networked devices. This makes it a versatile tool for different environments and use cases.
- **Data Security**: By supporting HTTPS, `Clipify` ensures that all data transferred between the client and server is encrypted, making it safe from eavesdropping.
- **Simplicity**: The `Clipify` is lightweight, easy to set up, and can be run both locally and within a Docker container. It uses SQLite for local storage, which is simple and requires minimal configuration.
- **Privacy**: All data remains within your local network, providing you complete control over your information without relying on third-party services.
- **Use Case Flexibility**: Whether you need to manage data for development, personal use, or even automation tasks, `Clipify` offers a simple and efficient way to keep your data synchronized across devices.


![Screenshot](ui.png)

## Requirements


- Go 1.23+

## How to Run the Server

### Prerequisites

Before running the server, make sure you have the following dependencies installed:

- **Go**: Install the Go programming language [here](https://golang.org/dl/).
- **SQLite**: Ensure you have the `sqlite` library for Go (imported via `modernc.org/sqlite`).

### Running Without Docker

1. **Clone the Repository**: Clone the repository or copy the Go code to your local machine.
2. **Install Dependencies**: Install the necessary Go packages:
    ```bash
    go mod tidy
    ```
3. **SSL Certificates**: Ensure you have SSL certificates (`localhost.crt` and `localhost.key`) in the same directory as the Go source code. These certificates will be used for the HTTPS server.
    - If you don’t have them, you can generate self-signed certificates using OpenSSL:
        ```bash
        openssl req -new -newkey rsa:2048 -days 365 -nodes -x509 -keyout localhost.key -out localhost.crt
        ```
4. **Run the Server**: Start the Go server:
    ```bash
    go run main.go
    ```
    The server will be running both on HTTP (default port 8080) and HTTPS (default port 8443). It will listen on your local machine's IP address.

### Running With Docker

To run the `Clipify` server using Docker, follow the steps below:

1. **Ensure Dockerfile and SSL Certificates Are Present**: The repository already contains a Dockerfile along with the required SSL certificates (`localhost.crt` and `localhost.key`).

2. **Build the Docker Image**:
    ```bash
    docker build -t clipify .
    ```

3. **Run the Docker Container**: Run the container using the following command to ensure proper networking:

    ```bash
    docker run -d --network host --name clipify clipify
    ```

    The `--network host` flag is necessary for the container to correctly bind to your local machine's network interfaces.

### Accessing the Clipify
To access `Clipify` from same or other devices on your local network, follow these steps:

1. **Find the Local IP of the Device Running Clipify**:
    - On the device running `Clipify`, find its local IP address. This is the IP address assigned to your device on your local network. You can get it using the following commands:
        - **Linux/macOS**: `ifconfig` or `ip a`
        - **Windows**: `ipconfig`

2. **Ensure Both Devices Are on the Same Network**:
    - Make sure the client device (e.g., your smartphone, tablet, or another computer) is connected to the same Wi-Fi or local network as the device running `Clipify`.

3. **Open the Clipify Server on Client Devices**:
    - On your client device, open a web browser (Chrome, Safari, etc.) and enter the local IP address of the server device followed by the port number. For example:
        - **HTTP**: `http://<local_ip>:8080`
        - **HTTPS**: `https://<local_ip>:8443`

    Replace `<local_ip>` with the local IP address of the server device.

4. **Access the Data**:
    - You can now interact with `Clipify` on your client device, adding or viewing clips, and using it just like you would on the device running the server.


### Environment Variables

You can customize the server's HTTP and HTTPS ports using the following environment variables:

- `CLIPIFY_HTTP_PORT`: The port for HTTP (default is `8080`).
- `CLIPIFY_HTTPS_PORT`: The port for HTTPS (default is `8443`).

For example, to run the server on port `9000` for HTTP and port `9443` for HTTPS, you can run:

```bash
CLIPIFY_HTTP_PORT=9000 CLIPIFY_HTTPS_PORT=9443 docker run -d --network host --name clipify clipify
```

## Contributing

Contributions are welcome! Please

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test the changes
5. Submit a pull request

## License

Apache License 2.0 - see LICENSE file for details
