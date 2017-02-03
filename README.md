dp-repo-template
================

A template git repository for DP repos:

* Standardised files for CHANGELOG, CONTRIBUTING, LICENSE and README
* Default template for GitHub pull requests

### Getting started

After creating a new repository on GitHub, use these commands to initialise
it using this repository as a template:

* `git clone git@github.com:ONSdigital/dp-repo-template dp-new-repo-name`
* `cd dp-new-repo-name`
* `git remote set-url origin git@github.com:ONSdigital/dp-new-repo-name`

Remember to update the [README](README.md) and [CHANGELOG](CHANGELOG.md) files.

### Configuration

An overview of the configuration options available, either as a table of
environment variables, or with a link to a configuration guide.

| Environment variable | Default | Description
| -------------------- | ------- | -----------
| BIND_ADDR            | :8080   | The host and port to bind to

### Contributing

See [CONTRIBUTING](CONTRIBUTING.md) for details.

### License

Copyright © 2016-2017, Office for National Statistics (https://www.ons.gov.uk)

Released under MIT license, see [LICENSE](LICENSE.md) for details.
