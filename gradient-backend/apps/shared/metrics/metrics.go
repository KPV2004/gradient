// apps/shared/metrics/metrics.go
package metrics

import (
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

var (
	// Grader metrics (ponytail: keep it simple and minimal)
	ActiveSandboxes = promauto.NewGauge(prometheus.GaugeOpts{
		Name: "gradient_grader_active_sandboxes",
		Help: "Number of active Docker sandboxes running code",
	})

	SubmissionsTotal = promauto.NewCounter(prometheus.CounterOpts{
		Name: "gradient_grader_submissions_total",
		Help: "Total number of submissions processed by the grader",
	})

	// CMS metrics
	DBConnectionsOpen = promauto.NewGauge(prometheus.GaugeOpts{
		Name: "gradient_cms_db_connections_open",
		Help: "Number of open database connections",
	})

	DBConnectionsInUse = promauto.NewGauge(prometheus.GaugeOpts{
		Name: "gradient_cms_db_connections_in_use",
		Help: "Number of database connections in use",
	})

	HTTPRequestsTotal = promauto.NewCounterVec(prometheus.CounterOpts{
		Name: "gradient_cms_http_requests_total",
		Help: "Total number of HTTP requests processed by CMS",
	}, []string{"method", "path", "status"})
)
