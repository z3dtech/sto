FROM node:latest

RUN mkdir /home/sto
ADD config.json /home/sto/config.json
RUN npm install -g sto
RUN cd /home/sto; sto

EXPOSE 443

