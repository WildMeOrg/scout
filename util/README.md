# Utility Scripts
Because Scout is a product that is always undergoing new development, there may be functionality that is planned for a later release that can be managed by external scripts. We strongly support users developing these scripts and sharing them with the Scout community at large.

The Wild Me team will review and publish all proposed utility scripts for general consumption.

## Standards and best practices
For any script submitted, include a comment at the top that covers:
- What you're doing
- Why you're doing it
- Required and Optional Inputs
- Expected Outputs

For each function within the script, include a brief comment describing the specific purpose of that function.

## Query Database
If you need to query the database to determine any information or data structure, use the following instructions.
1. With Scout running, use `docker ps` to find the name of running scout container (for this instruction set, we will use `goofy_lehmann`). You can also use the ID of container.
2. Use `docker exec -it goofy_lehmann bash` to get into the bash shell of your container.
3. Once in the container's bash shell, run `mongo` to connect to the localhost mongodb server.
4. Run `show dbs`.
5. Find your database, such as `scout-db-1696962852458` and run `use scout-db-1696962852458`.
6. Run `show collections` then you'll see all the tables.
7. To see all image information, run `db.images.find().pretty()`. Use this same pattern to query `tasks` or `annotations`.