help:
# Print help message for each command
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.?## "}; {printf "\033[36m%-30s\033[0m %s\n", substr($$1, 10), $$2}'

all: build run

deploy: build restart

build: ## build and run project
	pnpm install
	pnpm run build

run: ## run project
	pm2 start ./ecosystem.config.cjs

restart: ## restart project
	pm2 restart ./ecosystem.config.cjs
