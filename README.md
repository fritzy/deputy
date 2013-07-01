# deputy

Local Key-Bucket and Directory Database

deputy builds on levelup to provide advanced querying for your embedded key-store.
For now, deputy contains buckets and directories.

Buckets get niceties like proper Map-Reduce, key filters, indexes, and other queries.  
Directories build on that with directory nodes that provide key-sets within itself.

## Bucket

### put

### get

### getKeys

### keyFilter

### mapReduce

### atomic

## Directory

All of Bucket plus...

### makeDir

### moveDir

### moveObject

### write

### read

# Planned

* EventEmitter (WildEmitter) for key CRUD in buckets and directories.
* Directory tweaked map-reduce to include directory index information.
* Explicit index support in Bucket (queryByIndex, setIndex, etc)
