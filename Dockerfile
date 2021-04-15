# Dockerfile

# base image
FROM node:alpine

# create & set working directory
RUN mkdir -p /app
WORKDIR /app

# install dependencies
COPY package.json yarn.lock /app/
RUN yarn install

# copy rest of the source files
COPY . /app

# run the build. TODO: the build is currently failing, needs fixing
RUN yarn build

# Start app. If DEBUG is set to 'true', it'll run with development server
EXPOSE 3000
CMD bin/run.sh
