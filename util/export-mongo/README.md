## Export mongo database from Scout container

If you need access to the mongo database, this little script will let you select the Scout container and the scout Mongo database within it, then export all the collections to json files in a target directory.

### Requirements

Python 3 - tested on python 3.12, probably works down to 3.8.

Scout installed and running as normal.

### Installation

Install requirements ('docker' the only module needed)

```
pip install -r requirements.txt
```

### Usage

Run the script

```
python3 scout_export.py
```

1. Select the correct container name - default Scout install creates a random name. If you have multiple containers running, you can use `docker ps | grep scout` to find the right one.
2. Click 'Get Databases' to get a list of databases in the container.
3. Select the database, it will begin with `scout-`.
4. Select the export directory and click 'Export Collections as JSON'.

### ToDo

1. Get a list of container names together with the image names, so you can select the correct Scout container.
2. Zip the exported json files into a single file.