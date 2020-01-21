# oh-docker-tag-action

### This action is used to get the current pull id and environment to create docker images with PR, latest and previous tags per environment


## Usage:
```
- name: oh-docker-tag-action
  uses: scheduleonce/oh-docker-tag-action@<current version>
  id: <any unique id>
  with:
  dockerServer: ${{ Your Docker Login Server }}
  username: ${{ Docker Username }}
  password: ${{ Docker Password }}
  imageTag: tag name for the docker image (optional)
  pullId: pull Id to be used as a tag name for docker image (optional)
  tagMap: |
    pattern in branch name to be replaced~>string it is replaced with when tagging (optional)
    test/~>dev
```
- dockerServer: Your docker server url
- username: Your docker Username
- password: Your docker password
- tagMap: Mapping to be used for creating image tags
- imageTag: Tag to be used for creating image tags ( Creates a image with the exact tag without replacement )
- pullId: Pull Id to be used for creating image tags ( Creates a image with the exact pull Id without replacement )
  Example:
  ```
  tagMap: |
    test~>dev
    live~>master
    special/~>
  ```
  - Image tags created from above example will be :
    - lets say, branchName = **test/myBranch** -> Image tag will be **dev-myBranch**
    - lets say, branchName = **live/myProdBranch** -> Image tag will be **master-myProdBranch**
    - lets say, branchName = **special/myBranch** -> Image tag will be **myBranch**


### For Contributors 
- Please follow and fully understand this link before making changes (https://help.github.com/en/actions/automating-your-workflow-with-github-actions/creating-a-javascript-action)