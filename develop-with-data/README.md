## Development

This `docker-compose.yml` file can be used to launch an instance of Scout for development purposes.
It will use the repo root directory (up one level) to run the code "live", which allows for editing and
testing code.

This docker image also comes with some **example data** which can be helpful in testing Scout development.

Also, this version of Scout **does not include scoutbot** and therefore does not require a GPU (and related setup
overhead) to function. This also means, however, that it cannot process images with ML classifiers.

## Usage

Running `docker-compose up` from this directory should be sufficient to fetch that docker image and run Scout.
There may be a few extra steps needed, depending on how your development is setup:

- you should first run `npm install` (once) from the repo directory, to make sure all necessary libraries are installed
- when you break out of scout with ctrl-C, it is best to also do `docker-compose down` to stop the container

Once running, use a browser to open http://localhost:1337. Login with `admin`/`admin` as username/password.

### Notes

- Example images are from the [WAID dataset from Applied Sciences](https://github.com/xiaohuicui/WAID/).
