FROM quay.io/qasimtech/mega-bot:latest

USER root

WORKDIR /root/puttus-ai

RUN apt-get update && \
    apt-get install -y build-essential python3 && \
    rm -rf /var/lib/apt/lists/*

COPY . .

RUN npm install

CMD ["npm", "start"]
