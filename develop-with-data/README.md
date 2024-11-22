# Development

This `docker-compose.yml` file can be used to launch an instance of Scout for development purposes.
It will use the repo root directory (up one level) to run the code "live", which allows for editing and
testing code.

This docker image also comes with some **example data** which can be helpful in testing Scout development.

Also, this version of Scout **does not include scoutbot** and therefore does not require a GPU (and related setup
overhead) to function. This also means, however, that it cannot process images with ML classifiers.

## One time setup
From root of the code directory, run `npm install` to make sure all necessary libraries are installed.

## Usage

1. From this directory (`/develop-with-data`), run `docker-compose up` to fetch that docker image and run Scout.
1. Once running, use a browser to open http://localhost:1337. Login with `admin`/`admin` as username/password.

## Troubleshooting
- If you encounter a docker error `urllib3.exceptions.URLSchemeUnknown: Not supported URL scheme http+docker`, try running `pip install requests=2.31.0`
- If your process fails, you should run `docker-compose down` to stop the container when you shut down your scout instance (`Ctrl+C`)

### Credit

- Example images are from the [WAID dataset from Applied Sciences](https://github.com/xiaohuicui/WAID/).
