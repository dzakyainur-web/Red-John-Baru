# Red John Discord Bot — multi-stage build
FROM golang:1.25-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/redjohn-bot .

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /out/redjohn-bot /redjohn-bot
USER nonroot
ENTRYPOINT ["/redjohn-bot"]
