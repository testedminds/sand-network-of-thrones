SHELL = /usr/bin/env bash

# Customize name and img for your project:
name = thrones
img = hub.docker.com/$(name)

latest = $(img):latest
number = `cat ./next-version.txt`
version = `date +%y.%m.%d`.$(number)

dev: stop build run sleep-2 open

version:
	@echo $(version)

sleep-%:
	sleep $*

build:
	echo "<div class='version'><a href='https://github.com/testedminds/sand-network-of-thrones/tree/v$(version)'>v$(version)</a></div>" > ./version.html
	docker build -t $(latest) .

run:
	docker run -d -p 80:80 --rm --name $(name) $(latest)

exec:
	docker exec -it $(name) bash

stop:
	-docker stop $(name)

open:
	open http://192.168.99.100

release: push tag update-version

push:
	docker tag $(latest) $(img):$(version)
	docker push $(latest)
	docker push $(img):$(version)

tag:
	git tag v$(version)
	git push --tags

update-version:
	echo $$(($(number) + 1)) > ./next-version.txt
	git add ./next-version.txt
	git commit -m "Bump version"
	git push
