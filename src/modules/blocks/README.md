# Blocks service

Want to share my thoughts about implementation here

## Files
First struggle was with defining how properly get file
by only `blockNumber` in case that we don't know how many
block are in one `compacted-{FIRST_BLOCK_NUMBER}-{LAST_BLOCK_NUMBER}.json.gz`

Get all files list from S3 each 5 minutes sounds as
not so good idea as far as we still may have issues with
traffic bills for it, but IMHO it is the best way to know
what we can process and what we cannot

## Concurrency
Maybe we could use some kind of queue to block download
in more fancy way and avoid using `setInterval` but as far
as test task I hope current straightforward way of blocking
request is ok

## Partial download
In the task description there is a hint about downloading
whole file and storing it on the disk, but it will increase
request time for first block of file, and we will have to set
bigger timeout window for concurrency blocker

Downloading parts from S3 consumes as much traffic as whole
file, so we don't lose or gain anything choosing one of the approaches

## Caching
Maybe it is a bit redundant to use cache here, it could be done
with just global object (and will work faster) but global
object is bad idea by itself

## Postscript
Just some thoughts

- Task is interesting, challenging, thank you for it
- Somehow @aws-sdk did not want to recognize `/data` and I spend
an hour to understand that it wants `data` instead...
- Not sure that storing 1k uncompressed files in file system is
good idea, maybe it is really better to store 10 compressed and
then work with them
- As far as 

