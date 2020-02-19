"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@actions/core");
const child_process_1 = require("child_process");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let pullId = process.env.PR_NUMBER
                ? process.env.PR_NUMBER
                : setPullId(core_1.getInput('pullId'));
            checkCommitMessage(process.env.COMMIT_MESSAGE);
            let environment = getEnvironment(process.env.GITHUB_BASE_REF);
            let repoName = process.env.GITHUB_REPOSITORY.split('/')[1];
            let dockerServer = yield loginDocker();
            let imageName = `${dockerServer}/kubernetes/${repoName}:${environment}`;
            yield changeLatestToPrevious(imageName);
            yield buildImage(imageName, pullId);
            yield pushImage([`${imageName}-latest`, `${imageName}-PR-${pullId}`]);
        }
        catch (error) {
            core_1.setFailed(error.message);
            throw error;
        }
    });
}
exports.run = run;
function checkCommitMessage(commitMessage) {
    if (!commitMessage) {
        console.error('Please add commit messages to your commits');
        return;
    }
    const commitMessagePattern = core_1.getInput('commitMessagePattern');
    if (commitMessagePattern) {
        const regex = new RegExp(commitMessagePattern, 'i');
        if (!regex.test(commitMessage)) {
            console.error('Your commit message must match the following regex: ' +
                commitMessagePattern);
        }
    }
}
function setPullId(pullId) {
    if (!pullId) {
        core_1.setFailed('No Pull Id Found, Please Provide a Pull Id');
    }
    else {
        core_1.setOutput('pullId', pullId);
        return pullId;
    }
}
function getEnvironment(branchName) {
    const tagMap = core_1.getInput('tagMap');
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
    targetEnv = targetEnv ? targetEnv : core_1.getInput('imageTag');
    if (!targetEnv) {
        core_1.setFailed('No Tag Found, Please Provide ImagTag or TagMap');
    }
    return targetEnv;
}
function loginDocker() {
    console.log('Logging In...');
    const username = core_1.getInput('username');
    const password = core_1.getInput('password');
    const dockerServer = core_1.getInput('dockerServer');
    child_process_1.execSync(`docker login ${dockerServer} -u ${username} -p ${password}`);
    return dockerServer;
}
function buildImage(imageName, pull_id) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Building the image...');
        child_process_1.execSync(`docker build . --tag ${imageName}-latest`);
        child_process_1.execSync(`docker build . --tag ${imageName}-PR-${pull_id}`);
    });
}
function changeLatestToPrevious(imageName) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let previousImage = `${imageName}-latest`;
            yield pullImage(previousImage);
            child_process_1.execSync(`docker tag ${imageName}-latest ${imageName}-previous`);
            yield pushImage([`${imageName}-previous`]);
            console.log('Updated "latest" tag to "previous"...');
        }
        catch (error) {
            console.log('Latest image does not exist, skipping to next phase..');
        }
    });
}
function pushImage(images) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Pushing the image...');
        for (let i = 0; i < images.length; i++) {
            console.log('image ' + images[i]);
            child_process_1.exec(`docker push ${images[i]}`);
        }
    });
}
function pullImage(image) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Pulling the image...');
        child_process_1.execSync(`docker pull ${image}`);
    });
}
run();
//# sourceMappingURL=docker-tag.js.map