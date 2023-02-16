Use this to set up your signalling server.
Just run:

$ docker build -t signal-server:v1 .

And start container:

$ docker run -p 8080:8080 signal-server:v1