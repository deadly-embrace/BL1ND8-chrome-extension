FROM node:16-bullseye-slim
COPY . /app
WORKDIR /app
RUN npm install
EXPOSE 8080
CMD ["npm", "run", "start"]