FROM ubuntu:20.04

# Install apt packages
RUN set -ex \
 && apt-get update \
 && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        python3-dev \
        python3-pip \
        libglib2.0-0 \
 && rm -rf /var/cache/apt \
 && rm -rf /var/lib/apt/lists/*

RUN apt-get -y update && \
    apt-get -y install git && \
    apt-get clean  
#RUN pip install git+https://github.com/WildMeOrg/scoutbot.git --timeout=100


RUN apt-get update -y
RUN apt-get upgrade -y
RUN apt-get install curl -y
RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash
RUN apt-get install nodejs -y
RUN apt-get install wget -y
RUN apt-get install gnupg -y
RUN apt-get install mongodb -y

ENV DEBIAN_FRONTEND noninteractive
RUN apt-get install graphicsmagick -y
ENV DEBIAN_FRONTEND newt

RUN apt-get install dcraw -y

WORKDIR /usr/src/app

COPY package*.json ./
COPY . .

RUN mkdir /tmp/log

RUN mkdir /data
COPY ./dev-without-scoutbot/example_data/db /data/db
COPY ./dev-without-scoutbot/example_data/tmp /tmp/scout-tmp
COPY ./dev-without-scoutbot/example_data/nas /tmp/nas

RUN npm cache clean --force
RUN rm -rf node_modules
RUN npm install
RUN npm install sails -g
RUN npm install mongo-express@1.0.0 -g
RUN npm install gm -g
RUN npm install readline-sync --save
RUN npm install connect-mongodb-session --save
RUN npm install sails --save


EXPOSE 1337

RUN ["chmod", "+x", "/usr/src/app/docker-entrypoint.sh"]
CMD ["/usr/src/app/docker-entrypoint.sh"]
