up:
	docker-compose up --build

migrate-create:
	migrate create -ext sql -dir migrations $(name)

migrate-up:
	docker-compose run migrate

migrate-down:
	docker-compose run migrate -path=/migrations -database=postgres://postgres:password@db:5432/mydb?sslmode=disable down 1
