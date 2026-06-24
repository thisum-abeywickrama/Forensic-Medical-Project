pipeline {
    agent any

    // 1. Define tools managed by Jenkins, not the host system
    tools {
        nodejs 'NodeJS-20' // Ensure this matches the name in Manage Jenkins > Tools
    }

    environment {
        COMPOSE_PROJECT_NAME = 'Forensic-Medical-Project'
        // Define paths to avoid cluttering the root system
        DOCKER_BUILDKIT = '1' 
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build & Test') {
            parallel {
                stage('Backend') {
                    steps {
                        dir('backend') {
                            sh 'npm ci' // 'npm ci' is preferred over 'install' for CI environments
                            // sh 'npm test' 
                        }
                    }
                }
                stage('Frontend') {
                    steps {
                        dir('frontend') {
                            sh 'npm ci'
                            // sh 'npm test'
                        }
                    }
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    // Use try-catch to ensure we don't leave the app in a broken state
                    try {
                        sh '''
                            docker-compose down
                            docker-compose build --parallel --no-cache
                            docker-compose up -d --remove-orphans
                        '''
                    } catch (Exception e) {
                        error("Deployment failed: ${e.getMessage()}")
                    }
                }
            }
        }
    }

    post {
        always {
            // Prune only dangling images to save space without deleting base layers
            sh 'docker image prune -f'
            // Cleanup workspace to keep the 19GB drive healthy
            cleanWs()
        }
        failure {
            echo "Pipeline failed. Check logs at ${env.BUILD_URL}"
        }
    }
}