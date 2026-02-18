FROM quay.io/puttustech/puttus-bot:latest

WORKDIR /root/puttus-ai

RUN git clone https://github.com/puttus-das/PUTTUS-AI . && \
    npm install

EXPOSE 5000

CMD ["npm", "start"]
