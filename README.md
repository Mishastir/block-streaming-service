# Block streaming service

## Before the start

### Packages

According to `.nvmrc` project works with node 20.10,
but any 18+ node should work fine

run `npm install`

### Environment

1. Create `.env` file as copy of `.env.example`
2. Set empty env variables with values

## Startup

### Docker

To start project via Docker use next commands (change exposed ports if needed)

```bash
docker build -t block-streaming .
```

```bash
docker run -p 127.0.0.1:5100:5100 --env-file ./.env block-streaming -d
```

### Docker-compose

To start project via docker-compose use next command
(You may change port in `./docker-compose.dev.yaml`)
```bash
docker-compose -f ./docker-compose.dev.yaml -p block-streaming-service up -d
```

### Dev mode

To start project in dev mode use next command

```bash
npm run start:dev
```

