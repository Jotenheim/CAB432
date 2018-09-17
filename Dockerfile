FROM node:8

COPY . /src
WORKDIR /src

RUN npm install

EXPOSE 3000

CMD [ "npm", "start" ]
