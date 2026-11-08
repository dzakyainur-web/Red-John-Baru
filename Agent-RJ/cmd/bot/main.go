// Entry point alternatif — sama dengan root main.go.
package main

import (
	"context"
	"os"

	"github.com/r3nddy/Red-John/Agent-RJ/internal/app"
)

func main() {
	if err := app.Run(context.Background()); err != nil {
		os.Exit(1)
	}
}
