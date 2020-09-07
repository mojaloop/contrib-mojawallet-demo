FROM node:12-alpine  as builder

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN apk --no-cache add --virtual builds-deps build-base python

RUN npm install --frozen-lockfile
COPY . .
RUN npm run build

FROM node:12.16.1-alpine
WORKDIR /usr/src/app

# Create empty log file & link stdout to the application log file
RUN mkdir ./logs && touch ./logs/combined.log
RUN ln -sf /dev/stdout ./logs/combined.log

# Create a non-root user: ml-user
RUN adduser -D mojawallet-user
USER mojawallet-user

COPY --chown=mojawallet-user --from=builder /usr/src/app .
RUN npm prune --production

EXPOSE 3000
CMD ["npm", "run", "start"]
