# EZInterpolater
An AI frame interpolation project

This project is still in development.

## Results of training:

### Vimeo Model

No training:

![Server](./server/noTraining.gif)

5 epochs

![Server](./server/vimeo5.gif)

10 epochs

![Server](./server/vimeo10.gif)

20 epochs

![Server](./server/vimeo20.gif)

### Anime Model
20 epochs

![Server](./server/anime20.gif)

The anime model never achieved comparable results to the vimeo model.

## More Example Output

Vimeo 20 epochs

![Server](./server/vimeoGhibli20.gif)

Anime 20 epochs

![Server](./server/animeGhibli20.gif)

## CLI commands to run:

To use it you must run a server in the client directory and one in the server directory.

/client: npm run dev

/server: node server.js
