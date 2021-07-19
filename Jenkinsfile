// HELPER FUNCTIONS
def commitSha1() {
  sh 'git rev-parse HEAD > commitSha1'
  def commit = readFile('commitSha1').trim()
  sh 'rm commitSha1'
  // Use first 11 chars from full SHA1
  commit.substring(0, 11)
}
def getGitBranchName() {
  return scm.branches[0].name
}

def checkoutCode(Map args=[:]) {
  stage('Clone repository') {
    // CHECKOUT CODE REPO
    if(args.checkout_tag){
      scmVars = checkout([
          $class: 'GitSCM',
          branches: [[name: "refs/tags/${SELECTED_TAG}"]],
          doGenerateSubmoduleConfigurations: false,
          extensions: [[$class: 'CleanCheckout'],
          [$class: 'PruneStaleBranch']],
          submoduleCfg: []
      ])
      // Re-init variables
      prepareVars()
    } else {
      scmVars = checkout scm
    }
  }
}

def getEnvName() {
  if(env.BRANCH_NAME) {
    branch = env.BRANCH_NAME
  }
  branch = getGitBranchName()

  echo "Now we get branch ${branch}"

  if(env.TAG_NAME) {
    return 'tag'
  }
  switch(branch) {
    case ~/feature\/(.*)/:
      return 'ci'
      break;
    case 'master':
      return 'staging'
      break;
    default:
      if(env.SELECTED_TAG != null && SELECTED_TAG != '') {
        return 'production'
      } else {
        throw new Exception("Cannot define environment name! (raw: ${env.BRANCH_NAME})")
      }
  }
}

def prepareVars() {
  appName = 'tsxample'
  namespace = 'start'
  commitHash = commitSha1()
  envName = getEnvName()
  appFullName = "${appName}-${envName}"
  echo "This job running on [${envName}] configurations."
  // Docker registry
//   imgRepoServerUrl = 'registry.matador.ais.co.th'
//   imgRepoCred = 'nexus-matador-userpass-jenkinsopsta'
//   imgRepoName = 'lego/nocp/${appName}'
//   imgFullName = '${imgRepoServerUrl}/${imgRepoName}'
//   imgTag = '${envName}-${commitHash}'
//   imgDockerfile = 'Dockerfile'
  // HELM CHARTS
//   helmRepoUrl = 'https://git.matador.ais.co.th/oca/lego/iaac/helm-charts.git'
//   helmRepoCred = 'git-matador-userpass-jenkins'
//   helmSubDir = 'helm-charts'
//   helmChartName = './ais/basic'
//   helmChartVersion = '1.0.0'
//   helmValuesFile = '${WORKSPACE}/.helm/${appName}-${envName}.yaml'
//   helmWaitTimeout = '5m'
  // Tests variables
}

def compileAndRunUnitTest() {
  stage('Unit Test') {
    container('node') {
      sh "npm ci"
      sh "npm run lint"
      sh(script: "npm run test:ci", returnStdout: true).trim()
      junit 'coverage/unit.xml'
    }
  }
}

def runOWASP() {
  stage('OWASP scanner'){

    def owaspOptions = []
    owaspOptions.add("--scan 'src'")
    owaspOptions.add("--out dependency-check-report.xml")
    owaspOptions = owaspOptions.join(' ')

    dependencycheck(
      additionalArguments: owaspOptions,
      odcInstallation: "owasp-scanner"
    )

    dependencyCheckPublisher(
      pattern: 'dependency-check-report.xml'
    )
    // Cleanup report
    sh "rm -f dependency-check-report.xml"

  }
}

podTemplate(
  containers: [
    containerTemplate(name: 'node', image: 'node:16-alpine', command: 'cat', ttyEnabled: true),
    containerTemplate(name: 'docker', image: 'docker', command: 'cat', ttyEnabled: true),
    containerTemplate(name: 'helm', image: 'alpine/helm:3.3.4', command: 'cat', ttyEnabled: true),
  ],
  yaml: '''
  spec:
    securityContext:
      fsGroup: 1000
  ''',
  yamlMergeStrategy: override(),
  volumes: [
    hostPathVolume(mountPath: '/var/run/docker.sock', hostPath: '/var/run/docker.sock'),
    persistentVolumeClaim(mountPath: '/home/jenkins/agent/tools', claimName: 'jenkins-workspace', readOnly: false)
  ]
) {
  node(POD_LABEL) {

    checkoutCode()
    prepareVars()

    switch(envName) {
      case 'ci':
        compileAndRunUnitTest()
        // runOWASP()
        break
      case 'tag':
        // buildAndPushDockerImage()
        break
      case 'production':
        // checkoutCode(checkout_tag: true)
        // deployApp()
        break
    }
  }
}