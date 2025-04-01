package monitoring

import (
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

var (
	// HTTP-Anfragen-Metriken
	HttpRequestsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "http_requests_total",
			Help: "Gesamtzahl der HTTP-Anfragen",
		},
		[]string{"method", "path", "status"},
	)

	HttpRequestDuration = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "http_request_duration_seconds",
			Help:    "Dauer der HTTP-Anfragen in Sekunden",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"method", "path"},
	)

	// WebRTC-Metriken
	WebRTCConnections = promauto.NewGauge(
		prometheus.GaugeOpts{
			Name: "webrtc_connections",
			Help: "Aktuelle Anzahl der WebRTC-Verbindungen",
		},
	)

	WebRTCConnectionErrors = promauto.NewCounter(
		prometheus.CounterOpts{
			Name: "webrtc_connection_errors_total",
			Help: "Gesamtzahl der WebRTC-Verbindungsfehler",
		},
	)

	// Datenbank-Metriken
	DatabaseQueryDuration = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "database_query_duration_seconds",
			Help:    "Dauer der Datenbankabfragen in Sekunden",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"operation"},
	)

	DatabaseErrors = promauto.NewCounter(
		prometheus.CounterOpts{
			Name: "database_errors_total",
			Help: "Gesamtzahl der Datenbankfehler",
		},
	)

	// Speicher-Metriken
	MemoryUsage = promauto.NewGauge(
		prometheus.GaugeOpts{
			Name: "memory_usage_bytes",
			Help: "Aktueller Speicherverbrauch in Bytes",
		},
	)
)
