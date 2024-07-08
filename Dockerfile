FROM node:20.10-alpine as build

RUN mkdir -p /opt/node_app && chown -R node:node /opt/node_app
WORKDIR /opt/node_app

USER node

COPY --chown=node:node package*.json ./
RUN npm ci

COPY --chown=node:node tsconfig.json tsconfig.build.json ./
COPY --chown=node:node src ./src

RUN npm run build

FROM node:20.10-alpine as prod

RUN mkdir -p /opt/node_app && chown -R node:node /opt/node_app
WORKDIR /opt/node_app

USER node

COPY --chown=node:node --from=build /opt/node_app/package.json /opt/node_app/package-lock.json ./
COPY --chown=node:node --from=build /opt/node_app/node_modules ./node_modules
COPY --chown=node:node --from=build /opt/node_app/dist ./dist

ARG VERSION
ARG PORT=5100

ENV PORT $PORT
ENV PATH /opt/node_app/node_modules/.bin:$PATH
ENV VERSION=${VERSION:-unknown}
ENV NODE_ENV=production
ENV NODE_OPTIONS="--enable-source-maps"

EXPOSE $PORT
CMD [ "npm", "run", "start:prod"]
