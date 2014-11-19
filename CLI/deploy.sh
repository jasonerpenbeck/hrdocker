#!/bin/bash

# Make sure Docker is installed
DOCKERVERSION=$(sudo docker -v)
VERSIONMATCH="version 1.3"
echo $DOCKERVERSION

if expr match "$DOCKERVERSION" "$VERSIONMATCH"
  then echo "You have a good match.  Props!"
else
  echo "You need to update your Docker installation.  NO PROPS!"
fi

cat /etc/default/docker.io | sed 's/0.0.0.0/localhost/g' | sed 's/tlsverify/tls/' | sudo tee /etc/default/docker.io

export DOCKER_OPTS="$(cat /etc/default/docker.io | grep DOCKER_OPTS | sed 's/DOCKER_OPTS=//' | sed 's/\"//g')"
sudo service docker.io restart

sudo docker $DOCKER_OPTS -d &

echo "Pulling image from DockerHub"
sudo docker $DOCKER_OPTS pull willchen90/yo-mean:copied

echo "Starting a mongo container"
sudo docker $DOCKER_OPTS run --restart=always -d --name db mongo:latest

echo "Creating application container"
echo "Linking to mongo container"
echo "Running application script"
sudo docker $DOCKER_OPTS run --restart=always -p 80:9000 --link db:dbLink willchen90/yo-mean:copied

# echo "Your application is deployed at: http://Cloud-service-name:80"