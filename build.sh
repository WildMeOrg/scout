export DOCKER_BUILDKIT=1

export DOCKER_CLI_EXPERIMENTAL=enabled

# Change to the script's root directory location
cd ${ROOT_LOC}

# Build the images in dependence order
while [ $# -ge 1 ]; do
    if [ "$1" == "scout" ]; then
        echo "Current working directory: $PWD"
        docker build \
            --compress \
            -t wildme/scout:latest \
            --no-cache \
            .
    else
        echo "Image $1 not found"
        exit 1
    fi
    shift
done
