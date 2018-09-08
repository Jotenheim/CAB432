FROM node:8

RUN npm install nodemon -g

WORKDIR /src
ADD package.json .
RUN npm install
