FROM golang:1.21

# Install Air binary from GitHub Release
RUN curl -sSL https://github.com/air-verse/air/releases/download/v1.61.7/air_1.61.7_linux_amd64.tar.gz | tar -xz -C /usr/local/bin

WORKDIR /app
COPY . .

CMD ["air"]
