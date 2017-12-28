FROM node:latest

ADD config.json /tmp/config.json
RUN ls /tmp
RUN npm install -g sto
RUN cd /tmp; sto

EXPOSE 443

