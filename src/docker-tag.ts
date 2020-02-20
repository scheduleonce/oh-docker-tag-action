import { setOutput, getInput, setFailed, warning } from '@actions/core';
import { execSync, exec } from 'child_process';
import { bold, red } from 'ansi-colors';
export async function run() {
  try {
    let pullId = process.env.PR_NUMBER
      ? process.env.PR_NUMBER
      : setPullId(getInput('pullId'));
    checkCommitMessage(process.env.COMMIT_MESSAGE);
    let environment = getEnvironment(process.env.GITHUB_BASE_REF);
    let repoName = process.env.GITHUB_REPOSITORY.split('/')[1];
    let dockerServer = await loginDocker();
    let imageName = `${dockerServer}/kubernetes/${repoName}:${environment}`;
    await changeLatestToPrevious(imageName);
    await buildImage(imageName, pullId);
    await pushImage([`${imageName}-latest`, `${imageName}-PR-${pullId}`]);
  } catch (error) {
    setFailed(error.message);
    throw error;
  }
}

function checkCommitMessage(commitMessage: string) {
  if (!commitMessage) {
    console.error(bold(red('Please add commit messages to your commits')));
    return;
  }
  const commitMessagePattern = getInput('commitMessagePattern');
  if (commitMessagePattern) {
    const regex = new RegExp(commitMessagePattern, 'i');
    if (!regex.test(commitMessage)) {
      console.error(
        bold(
          red(
            'Your commit message must match the following regex: ' +
              commitMessagePattern
          )
        )
      );
    }
  }
}

function setPullId(pullId) {
  if (!pullId) {
    setFailed('No Pull Id Found, Please Provide a Pull Id');
  } else {
    setOutput('pullId', pullId);
    return pullId;
  }
}

function getEnvironment(branchName) {
  const tagMap = getInput('tagMap');
  const tags = tagMap.split('\n');
  let targetEnv;
  for (let i = 0; i < tags.length; i++) {
    let tagReplacements = tags[i].split('~>');
    if (branchName.startsWith(tagReplacements[0])) {
      targetEnv = branchName.replace(tagReplacements[0], tagReplacements[1]);
      targetEnv = targetEnv.split('/').join('-');
      break;
    }
  }
  targetEnv = targetEnv ? targetEnv : getInput('imageTag');
  if (!targetEnv) {
    setFailed('No Tag Found, Please Provide ImagTag or TagMap');
  }
  return targetEnv;
}

function loginDocker() {
  console.log('Logging In...');
  const username = getInput('username');
  const password = getInput('password');
  const dockerServer = getInput('dockerServer');
  execSync(`docker login ${dockerServer} -u ${username} -p ${password}`);
  return dockerServer;
}

async function buildImage(imageName, pull_id) {
  console.log('Building the image...');
  execSync(`docker build . --tag ${imageName}-latest`);
  execSync(`docker build . --tag ${imageName}-PR-${pull_id}`);
}

async function changeLatestToPrevious(imageName) {
  try {
    let previousImage = `${imageName}-latest`;
    await pullImage(previousImage);
    execSync(`docker tag ${imageName}-latest ${imageName}-previous`);
    await pushImage([`${imageName}-previous`]);
    console.log('Updated "latest" tag to "previous"...');
  } catch (error) {
    console.log('Latest image does not exist, skipping to next phase..');
  }
}

async function pushImage(images) {
  console.log('Pushing the image...');
  for (let i = 0; i < images.length; i++) {
    console.log('image ' + images[i]);
    exec(`docker push ${images[i]}`);
  }
}

async function pullImage(image) {
  console.log('Pulling the image...');
  execSync(`docker pull ${image}`);
}
run();
