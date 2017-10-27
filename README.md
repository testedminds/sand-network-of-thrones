# Network of Thrones

A [node-link diagram](https://en.wikipedia.org/wiki/Graph_drawing) of Game of Thrones interactions created as an example of using [SAND](https://github.com/testedminds/sand) to analyze social networks.

See the running application at [http://got.testedminds.com](http://got.testedminds.com)


## Getting Started

Run `jupyter notebook` to run the network analysis, visualize in Cytoscape, and export data and style in Cytoscape format.

Run `make dev` to build a Docker container to run the JavaScript version of the visualization as a static site served by
an nginx container.


## Versioning

The Docker image is versioned using a date-based scheme matching a regular time-based release cadence:

YEAR.MONTH.DAY.VERSION


## License

Copyright © Bobby Norton and [Tested Minds, LLC](http://www.testedminds.com).

Released under the [Apache License, Version 2.0](./LICENSE.txt)
