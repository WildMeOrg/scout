# Scout

Scout is a software application designed to support annotation labs processing imagery from aerial surveys, such as animal counts and forest health evaluations.

With Scout, you can:

* Ingest high volumes of .ARW and .JPG images collected from survey cameras
* Group images as "Tasks" that can be assigned to other users (e.g., image annotators) or machine learning (ML) models for bounding box creation and species labeling
* Review and ground truth annotated images for accuracy
* Draw division lines for overlapping image sequences with annotations
* Export CSV data files for statistical analysis


## System Requirements
**NOTE**: This software is designed to run on an air-gapped private network only. (Significant security modifications are needed before this platform is suitable for installation on a public network or cloud).

* A fast and stable internet connection.
* An 8GB-minimum thumbdrive.
* A dedicated, powerful laptop with a graphics processing unit (GPU) to run solely as the Scout server. 
* Laptops with the Chrome web browser to connect to the Scout server for lab leads and annotators.

## Installation
For installation and first-time configuration steps, follow our [Server System Setup](https://scout.docs.wildme.org/setup-and-maintenance/index.html) documentation guide. 

## Dev Setup
We welcome any and all contributions on the Scout tool. See our documentation for information on [Dev Environment Setup](https://scout.docs.wildme.org/contribute/dev-setup.html). If you're interested in contributing on the ML side, see the [Scoutbot readme](https://github.com/WildMeOrg/scoutbot). We are still working on a method of accepting contributions for ML, but would love to hear your ideas!

## Important Links & Documentation
- [Help Documentation](https://scout.docs.wildme.org/) to learn how to use Scout.
- [Wild Me Professional Services](https://www.wildme.org/services) to view the range of services we can offer. 
- [Wild Me Development Discord](https://discord.gg/zw4tr3RE4R) for assistance with setup and installation, or for interest in development.
- [Community forum](https://community.wildme.org) for usage issues and customer support.


## Usage

https://github.com/user-attachments/assets/56c1dbf3-2bd4-4df1-aa3e-85e31bd48b39

Once you've set up Scout, you can create and manage user accounts, upload images, coordinate tasks, review and ground truth annotations, draw division lines, and export data. Then collectively work with your team to draw and label bounding boxes representing animals on images, leveraging AI to process the imagery as quickly as possible.  


## Techstack and Features

Scout uses Javascript (Sails.js) and integrated machine learning provided by [Scoutbot](https://github.com/WildMeOrg/scoutbot). 


## License

Scout is licensed under the [MIT open source license](https://opensource.org/license/mit/).

